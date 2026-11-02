using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.Json;
using CoreClash.Data;

namespace CoreClash.SelfPlay
{
    // dotnet run -c Release --project Tests/SelfPlay -- --out <dir outside repo> [--seed N] [--per-cell N]
    //     [--strategies random,fixed,heuristic] [--decks id,id,...] [--threads N] [--root <unity project>]
    // dotnet run -c Release --project Tests/SelfPlay -- --compare <runDirA> <runDirB>
    // Exit: 0 all matches completed (and >= --min-matches), 1 a match failed / runs differ / data changed, 2 usage error.
    public static class SelfPlayCli
    {
        public static int Main(string[] args)
        {
            try{return Run(args);}
            catch(ArgumentException e){Console.Error.WriteLine("USAGE: "+e.Message);return 2;}
        }

        static int Run(string[] args)
        {
            var c=CultureInfo.InvariantCulture;
            var opt=new Dictionary<string,string>(StringComparer.Ordinal);var compare=new List<string>();
            for(int i=0;i<args.Length;i++)
            {
                if(args[i]=="--compare"){if(i+2>=args.Length)throw new ArgumentException("--compare needs two run directories");compare.Add(args[++i]);compare.Add(args[++i]);continue;}
                if(!args[i].StartsWith("--",StringComparison.Ordinal)||i+1>=args.Length)throw new ArgumentException("unexpected argument "+args[i]);
                opt[args[i].Substring(2)]=args[++i];
            }
            if(compare.Count==2)return Compare(compare[0],compare[1]);

            string root=Path.GetFullPath(opt.TryGetValue("root",out var rr)?rr:Path.Combine(AppContext.BaseDirectory,"../../../../.."));
            if(!File.Exists(Path.Combine(root,"Assets/Resources/Data/catalog.json")))throw new ArgumentException("--root must be the Unity project (Assets/Resources/Data/catalog.json not found under "+root+")");
            if(!opt.TryGetValue("out",out var outDir))throw new ArgumentException("--out <directory> is required");
            outDir=Path.GetFullPath(outDir);
            if(outDir.StartsWith(root.TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new ArgumentException("--out must be outside the project");
            var config=new SelfPlayConfig();
            if(opt.TryGetValue("seed",out var seed))config.Seed=ulong.Parse(seed,c);
            if(opt.TryGetValue("per-cell",out var per))config.PerCell=int.Parse(per,c);
            if(opt.TryGetValue("strategies",out var st))config.Strategies=st.Split(',',StringSplitOptions.RemoveEmptyEntries);
            if(opt.TryGetValue("decks",out var dk))config.DeckIds=dk.Split(',',StringSplitOptions.RemoveEmptyEntries);
            config.Threads=opt.TryGetValue("threads",out var th)?int.Parse(th,c):Environment.ProcessorCount;
            int minMatches=opt.TryGetValue("min-matches",out var mm)?int.Parse(mm,c):1000;
            foreach(var s in config.Strategies)SelfPlayStrategies.Create(s);
            if(config.PerCell<1||config.Threads<1)throw new ArgumentException("--per-cell and --threads must be >= 1");

            var json=new JsonSerializerOptions{IncludeFields=true};
            string catalogPath=Path.Combine(root,"Assets/Resources/Data/catalog.json"),featuredPath=Path.Combine(root,"Assets/Resources/Data/featured-decks.json");
            string catalogHashBefore=FileHash(catalogPath),featuredHashBefore=FileHash(featuredPath);
            var catalog=new Catalog(JsonSerializer.Deserialize<CatalogData>(File.ReadAllText(catalogPath),json),JsonSerializer.Deserialize<FeaturedDeckData>(File.ReadAllText(featuredPath),json));
            string catalogStateBefore=SelfPlayRunner.Hash(JsonSerializer.Serialize(catalog.Data,json)+JsonSerializer.Serialize(catalog.Featured,json));

            Directory.CreateDirectory(outDir);
            string environment=RuntimeInformation.FrameworkDescription+", "+RuntimeInformation.OSDescription+" "+RuntimeInformation.ProcessArchitecture+", "+Environment.ProcessorCount.ToString(c)+" logical CPUs, threads "+config.Threads.ToString(c);
            Console.WriteLine("CC-001 W19-03 self-play: "+environment);
            var total=Stopwatch.StartNew();var cpuStart=Process.GetCurrentProcess().TotalProcessorTime;int done=0;
            var records=SelfPlayRunner.Run(catalog,config,r=>{done++;if(r.status!="OK")Console.WriteLine("FAILED match "+r.index.ToString(c)+": "+r.failure);if(done%100==0)Console.WriteLine(done.ToString(c)+" matches, "+total.Elapsed.TotalSeconds.ToString("0",c)+" s");});
            total.Stop();var cpu=Process.GetCurrentProcess().TotalProcessorTime-cpuStart;

            string catalogStateAfter=SelfPlayRunner.Hash(JsonSerializer.Serialize(catalog.Data,json)+JsonSerializer.Serialize(catalog.Featured,json));
            bool dataUnchanged=catalogStateBefore==catalogStateAfter&&catalogHashBefore==FileHash(catalogPath)&&featuredHashBefore==FileHash(featuredPath);
            var summary=SelfPlaySummary.From(records);string digest=SelfPlayRunner.Digest(records);

            File.WriteAllText(Path.Combine(outDir,"matches.csv"),SelfPlayRunner.Csv(records));
            File.WriteAllText(Path.Combine(outDir,"timing.csv"),SelfPlayRunner.TimingCsv(records));
            File.WriteAllText(Path.Combine(outDir,"matches.json"),JsonSerializer.Serialize(records,new JsonSerializerOptions{IncludeFields=true,WriteIndented=false}));
            var meta=new{
                tool="CC-001 W19-03 self-play",seed=config.Seed.ToString(c),perCell=config.PerCell,strategies=config.Strategies,decks=SelfPlayRunner.Decks(catalog,config.DeckIds).Select(d=>d.id).ToArray(),
                threads=config.Threads,dt=config.Dt,maxFramesPerAction=config.MaxFramesPerAction,maxActions=config.MaxActions,gameplayRandomStateStart=149,
                digest,catalogSha256=catalogHashBefore,featuredSha256=featuredHashBefore,dataUnchanged,
                environment,wallSeconds=Math.Round(total.Elapsed.TotalSeconds,1),processCpuSeconds=Math.Round(cpu.TotalSeconds,1),
                matchWallMsMedian=Median(records.Select(r=>r.wallMs)),matchWallMsMax=Math.Round(records.Count==0?0:records.Max(r=>r.wallMs),1),
                minMatches,summary};
            File.WriteAllText(Path.Combine(outDir,"summary.json"),JsonSerializer.Serialize(meta,new JsonSerializerOptions{IncludeFields=true,WriteIndented=true}));
            File.WriteAllText(Path.Combine(outDir,"report.md"),summary.Markdown(config,digest,environment+"; process CPU "+cpu.TotalSeconds.ToString("0.0",c)+" s",total.Elapsed.TotalSeconds));

            bool ok=summary.failed==0&&summary.total>=minMatches&&dataUnchanged;
            Console.WriteLine("RESULT "+(ok?"OK":"FAIL")+": matches "+summary.total.ToString(c)+" completed "+summary.completed.ToString(c)+" failed "+summary.failed.ToString(c)+
                " | P1 "+summary.p1Wins.ToString(c)+" P2 "+summary.p2Wins.ToString(c)+" draw "+summary.draws.ToString(c)+" | turns median "+summary.turnsMedian.ToString(c)+" P90 "+summary.turnsP90.ToString(c)+
                " | tiebreak "+summary.tiebreakEnds.ToString(c)+" | illegal "+summary.illegalProposals.ToString(c)+" | data unchanged "+dataUnchanged+" | digest "+digest+" | "+total.Elapsed.TotalSeconds.ToString("0.0",c)+" s");
            return ok?0:1;
        }

        // Two runs are equal when every per-match deterministic column matches
        // byte for byte (wall time lives in timing.csv and is not compared).
        static int Compare(string a,string b)
        {
            string fa=Path.Combine(a,"matches.csv"),fb=Path.Combine(b,"matches.csv");
            if(!File.Exists(fa)||!File.Exists(fb))throw new ArgumentException("matches.csv missing in one of the run directories");
            var la=File.ReadAllLines(fa);var lb=File.ReadAllLines(fb);
            int diff=0;for(int i=0;i<Math.Max(la.Length,lb.Length);i++)if(i>=la.Length||i>=lb.Length||la[i]!=lb[i]){if(diff<5)Console.WriteLine("DIFF line "+(i+1).ToString(CultureInfo.InvariantCulture));diff++;}
            bool bytes=File.ReadAllBytes(fa).AsSpan().SequenceEqual(File.ReadAllBytes(fb));
            Console.WriteLine("COMPARE "+(diff==0&&bytes?"IDENTICAL":"DIFFERENT")+": lines "+la.Length.ToString(CultureInfo.InvariantCulture)+" vs "+lb.Length.ToString(CultureInfo.InvariantCulture)+", differing "+diff.ToString(CultureInfo.InvariantCulture)+", sha256 "+FileHash(fa)+" / "+FileHash(fb));
            return diff==0&&bytes?0:1;
        }

        static string FileHash(string path){using var sha=System.Security.Cryptography.SHA256.Create();using var f=File.OpenRead(path);return Convert.ToHexString(sha.ComputeHash(f)).ToLowerInvariant();}
        static double Median(IEnumerable<double> values){var v=values.OrderBy(x=>x).ToArray();return v.Length==0?0:Math.Round(v[v.Length/2],1);}
    }
}
