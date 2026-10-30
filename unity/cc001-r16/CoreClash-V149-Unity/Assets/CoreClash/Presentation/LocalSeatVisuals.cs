namespace CoreClash.Presentation
{
    // Visual disclosure only. The authoritative GameState, command owner and network
    // connection are never modified here. An opponent's launcher cannot preview
    // the currently selected ball from this device's deck.
    public static class LocalSeatVisuals
    {
        public static bool ShowLocalMarker(bool networked, bool connected, int localOwner, int seat)
        {
            return networked && connected &&
                (localOwner == 0 || localOwner == 1) && seat == localOwner;
        }

        public static bool ShowSelectedPreview(bool networked, bool connected,
            int localOwner, int activeOwner, bool canChoose)
        {
            if (!canChoose || (activeOwner != 0 && activeOwner != 1)) return false;
            if (!networked) return true; // offline hotseat keeps its active launcher preview
            return connected && (localOwner == 0 || localOwner == 1) && activeOwner == localOwner;
        }
    }
}
