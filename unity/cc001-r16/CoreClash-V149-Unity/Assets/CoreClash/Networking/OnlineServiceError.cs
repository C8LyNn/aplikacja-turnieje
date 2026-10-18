using System;

namespace CoreClash.Networking
{
    // Narrow adapter for error details whose typed reason is discarded by pinned MPS 2.2.4.
    public static class OnlineServiceError
    {
        public const string Full="This game already has two players. Ask the host to create another game.";
        public const string InvalidCode="That game code is invalid. Copy the current code from the host and try again.";
        public static string FromUntypedLobbyDetail(string detail)
        {
            if(string.IsNullOrEmpty(detail)||detail.Length>1024)return "";
            detail=detail.Trim();
            if(string.Equals(detail,"lobby is full",StringComparison.OrdinalIgnoreCase))return Full;
            if(detail.StartsWith("lobby code '",StringComparison.OrdinalIgnoreCase)&&
               detail.IndexOf(" contains an invalid character ",StringComparison.OrdinalIgnoreCase)>=0)return InvalidCode;
            return "";
        }
    }
}
