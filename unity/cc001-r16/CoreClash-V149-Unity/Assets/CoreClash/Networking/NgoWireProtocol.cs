using System;
using System.IO;
using System.IO.Compression;
using System.Text;

namespace CoreClash.Networking
{
    // Pure managed codec: no Unity engine or network dependency, shared by native and WebGL.
    public static class NgoWireProtocol
    {
        public const int ChunkBytes=900,MaxJsonBytes=2*1024*1024,MaxCompressedBytes=256*1024;
        public const int MaxChunks=(MaxCompressedBytes+ChunkBytes-1)/ChunkBytes;
        public static byte[] Encode(string json)
        {
            if(string.IsNullOrEmpty(json))throw new InvalidDataException("Empty snapshot.");
            var raw=Encoding.UTF8.GetBytes(json);
            if(raw.Length>MaxJsonBytes)throw new InvalidDataException("Snapshot exceeds raw byte limit.");
            using(var output=new MemoryStream()){
                using(var gzip=new GZipStream(output,CompressionLevel.Fastest,true))gzip.Write(raw,0,raw.Length);
                var packed=output.ToArray();
                if(packed.Length>MaxCompressedBytes)throw new InvalidDataException("Snapshot exceeds compressed byte limit.");
                return packed;
            }
        }
        public static string Decode(byte[] payload)
        {
            if(payload==null||payload.Length==0||payload.Length>MaxCompressedBytes)throw new InvalidDataException("Invalid compressed snapshot size.");
            using(var input=new MemoryStream(payload))using(var gzip=new GZipStream(input,CompressionMode.Decompress))using(var output=new MemoryStream()){
                var buffer=new byte[4096];int read;
                while((read=gzip.Read(buffer,0,buffer.Length))>0){
                    if(output.Length+read>MaxJsonBytes)throw new InvalidDataException("Inflated snapshot exceeds byte limit.");
                    output.Write(buffer,0,read);
                }
                return Encoding.UTF8.GetString(output.ToArray());
            }
        }
        public static byte[][] Split(byte[] payload)
        {
            if(payload==null||payload.Length==0||payload.Length>MaxCompressedBytes)throw new InvalidDataException("Invalid snapshot payload.");
            var result=new byte[(payload.Length+ChunkBytes-1)/ChunkBytes][];
            for(int i=0;i<result.Length;i++){int length=Math.Min(ChunkBytes,payload.Length-i*ChunkBytes);result[i]=new byte[length];Buffer.BlockCopy(payload,i*ChunkBytes,result[i],0,length);}
            return result;
        }
    }
    public sealed class NgoSnapshotAssembler
    {
        int completedRevision=-1,inflightRevision=-1,received,totalBytes;
        byte[][] chunks;
        public bool Add(int revision,int index,int count,byte[] payload,out string json)
        {
            json=null;
            if(revision<0||revision<=completedRevision||revision<inflightRevision||count<1||count>NgoWireProtocol.MaxChunks||index<0||index>=count||payload==null||payload.Length==0||payload.Length>NgoWireProtocol.ChunkBytes)return false;
            if(revision>inflightRevision){inflightRevision=revision;chunks=new byte[count][];received=totalBytes=0;}
            if(chunks==null||chunks.Length!=count||chunks[index]!=null)return false;
            if(totalBytes+payload.Length>NgoWireProtocol.MaxCompressedBytes)return false;
            chunks[index]=payload;received++;totalBytes+=payload.Length;
            if(received!=count)return false;
            var packed=new byte[totalBytes];int offset=0;
            foreach(var chunk in chunks){Buffer.BlockCopy(chunk,0,packed,offset,chunk.Length);offset+=chunk.Length;}
            json=NgoWireProtocol.Decode(packed);completedRevision=revision;chunks=null;return true;
        }
    }
}
