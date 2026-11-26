using System;
using System.Linq;
using CoreClash.Data;

namespace CoreClash.Networking
{
    // CC-001 W24 (the brief of the owner's course project, 2026-11-25): "before the game proper the
    // players come to a lobby where they can get ready; the game starts only when every one of them
    // has confirmed that they are ready; the host controls the start" - and after a match the
    // players can play again, play the next level or go back to the lobby.
    //
    // This is the room: who is in it, which deck each player brings, who has said "ready", the rules
    // the host set, the score of the session. The host's copy is the only one that decides anything
    // (MatchLobby); the guest shows what the host sends (LobbyState) and asks for changes
    // (LobbyChoice). Nothing here knows about the transport or about Unity.

    [Serializable] public sealed class LobbySeat
    {
        public bool present,ready;
        public string deckId="",deckName="";
        public string[] balls=new string[0];
        public int color,wins;
    }

    [Serializable] public sealed class LobbyState
    {
        public int protocol=MatchLobby.Protocol,revision,round;
        // false: the players are in the lobby. true: a match of this session is on (or just over).
        public bool inMatch;
        public string roomName="",map="";
        public float ballScale=1;
        public bool doubleTurn;
        public LobbySeat host=new LobbySeat{present=true},guest=new LobbySeat();
        public LobbySeat Seat(int owner)=>owner==0?host:guest;
    }

    // What the guest asks for: its deck, the colour it would like, whether it is ready.
    [Serializable] public sealed class LobbyChoice
    {
        public string deckId="",deckName="";
        public string[] balls=new string[0];
        public int color;
        public bool ready;
    }

    public enum LobbyBlock { None, InMatch, NoGuest, HostDeck, GuestDeck, HostNotReady, GuestNotReady }

    public sealed class MatchLobby
    {
        public const int Protocol=1,MaxText=40,MaxWire=4096;
        // What a guest may ask of the host besides its choice.
        public const int RequestLobby=1;
        readonly Catalog catalog;
        readonly bool activeOnly;
        int countedRound;
        public LobbyState State{get;}=new LobbyState();

        // activeOnly: a deck may hold only balls of the active roster (the game's own rule for a
        // match between two ready-made or home-built decks).
        public MatchLobby(Catalog catalog,bool activeOnly)
        {
            this.catalog=catalog??throw new ArgumentNullException(nameof(catalog));this.activeOnly=activeOnly;
        }
        void Touch(){State.revision++;}

        public bool ValidDeck(string[] balls)
            =>balls!=null&&balls.Length==9&&balls.Distinct().Count()==9&&balls.All(id=>!string.IsNullOrEmpty(id)&&catalog.Ball(id)!=null&&(!activeOnly||catalog.IsActive(id)));
        public static string Clean(string text)
        {
            if(string.IsNullOrEmpty(text))return "";
            var kept=new string(text.Where(c=>!char.IsControl(c)).ToArray()).Trim();
            return kept.Length>MaxText?kept.Substring(0,MaxText):kept;
        }

        public void SetRoom(string name){name=Clean(name);if(State.roomName!=name){State.roomName=name;Touch();}}
        public void SetRules(string map,float ballScale,bool doubleTurn)
        {
            map=Clean(map);
            if(State.map==map&&State.ballScale==ballScale&&State.doubleTurn==doubleTurn)return;
            State.map=map;State.ballScale=ballScale;State.doubleTurn=doubleTurn;
            // The guest said "ready" to the rules it saw: other rules, and it confirms again.
            if(!State.inMatch)State.guest.ready=false;
            Touch();
        }
        public void SetColors(int hostColor,int guestColor)
        {
            if(State.host.color==hostColor&&State.guest.color==guestColor)return;
            State.host.color=hostColor;State.guest.color=guestColor;Touch();
        }

        // A player brings another deck: allowed in the lobby only, and it takes that player's
        // "ready" back - the other side agreed to play against the deck it saw.
        public bool SetDeck(int owner,string id,string name,string[] balls)
        {
            if(owner<0||owner>1||State.inMatch||!ValidDeck(balls))return false;
            var seat=State.Seat(owner);if(!seat.present)return false;
            if(seat.balls!=null&&seat.balls.SequenceEqual(balls)&&seat.deckId==(id??""))return true;
            seat.deckId=Clean(id);seat.deckName=Clean(name);seat.balls=(string[])balls.Clone();seat.ready=false;Touch();return true;
        }
        public bool SetReady(int owner,bool ready)
        {
            if(owner<0||owner>1||State.inMatch)return false;
            var seat=State.Seat(owner);
            if(!seat.present||(ready&&!ValidDeck(seat.balls)))return false;
            if(seat.ready!=ready){seat.ready=ready;Touch();}
            return true;
        }

        public void GuestJoined()
        {
            // The open seat of a match in progress is taken: the match and its deck go on.
            if(State.inMatch){State.guest.present=true;Touch();return;}
            // In the lobby a new guest starts with nothing chosen, the session's score starts again,
            // and the host confirms again: they agreed to play somebody else.
            State.guest=new LobbySeat{present=true,color=State.guest.color};
            State.host.wins=0;State.host.ready=false;State.round=0;countedRound=0;Touch();
        }
        public void GuestLeft()
        {
            if(!State.guest.present)return;
            if(State.inMatch){State.guest.present=false;Touch();return;}
            State.guest=new LobbySeat{present=false,color=State.guest.color};State.host.ready=false;Touch();
        }

        // The guest's message. A deck that is not allowed is not taken, and "ready" without a
        // valid deck is not taken either. During a match the room does not change.
        public bool Apply(LobbyChoice choice)
        {
            if(choice==null||State.inMatch||!State.guest.present)return false;
            bool changed=false;
            if(ValidDeck(choice.balls))changed|=SetDeck(1,choice.deckId,choice.deckName,choice.balls);
            bool ready=choice.ready&&ValidDeck(State.guest.balls);
            if(State.guest.ready!=ready){State.guest.ready=ready;Touch();changed=true;}
            return changed;
        }

        // Why the host cannot start yet - one reason, the first that holds. The guest's screen asks
        // the same question of the room the host sent (there a deck is "nine balls").
        public static LobbyBlock BlockOf(LobbyState state,Func<string[],bool> validDeck)
        {
            if(state==null||state.inMatch)return LobbyBlock.InMatch;
            if(!state.guest.present)return LobbyBlock.NoGuest;
            if(!validDeck(state.host.balls))return LobbyBlock.HostDeck;
            if(!validDeck(state.guest.balls))return LobbyBlock.GuestDeck;
            if(!state.guest.ready)return LobbyBlock.GuestNotReady;
            if(!state.host.ready)return LobbyBlock.HostNotReady;
            return LobbyBlock.None;
        }
        public LobbyBlock Blocked=>BlockOf(State,ValidDeck);
        public bool CanStart=>Blocked==LobbyBlock.None;

        // The host starts the match: only when everybody is ready.
        public bool Start()
        {
            if(!CanStart)return false;
            State.inMatch=true;State.round++;Touch();return true;
        }
        // The match of this round has a result: counted once.
        public void Finish(int winner)
        {
            if(!State.inMatch||countedRound==State.round)return;
            countedRound=State.round;
            if(winner==0)State.host.wins++;else if(winner==1)State.guest.wins++;
            Touch();
        }
        // Another match with the same decks, straight from the result screen.
        public bool Rematch()
        {
            if(!State.inMatch||!State.guest.present||!ValidDeck(State.host.balls)||!ValidDeck(State.guest.balls))return false;
            State.round++;Touch();return true;
        }
        // Back to the lobby: everybody confirms again before the next match.
        public void ReturnToLobby()
        {
            if(!State.inMatch)return;
            State.inMatch=false;State.host.ready=State.guest.ready=false;Touch();
        }

        public DeckDefinition Deck(int owner)=>DeckOf(State,owner,catalog);
        // The deck a seat brings, as a deck of the game. It carries a ready-made deck's id only when
        // it IS that deck (the same nine balls); anything else is that seat's own deck, so the two
        // decks of a match never share an id.
        public static DeckDefinition DeckOf(LobbyState state,int owner,Catalog catalog)
        {
            var seat=state.Seat(owner);var balls=seat.balls??new string[0];
            var known=string.IsNullOrEmpty(seat.deckId)?null:catalog?.Deck(seat.deckId);
            if(known!=null&&known.balls!=null&&known.balls.SequenceEqual(balls))return known;
            return new DeckDefinition{id="custom_"+owner,name=string.IsNullOrEmpty(seat.deckName)?"Custom deck":seat.deckName,balls=(string[])balls.Clone(),description=""};
        }

        // What a guest takes from the host: only a well-formed room. Text is cut to size and decks
        // that are not nine known balls are shown as "no deck" - the guest's screen never trusts it.
        public static bool Admit(LobbyState state,Catalog catalog)
        {
            if(state==null||state.protocol!=Protocol||state.host==null||state.guest==null||state.revision<0||state.round<0)return false;
            if(float.IsNaN(state.ballScale)||float.IsInfinity(state.ballScale))return false;
            state.roomName=Clean(state.roomName);state.map=Clean(state.map);
            foreach(var seat in new[]{state.host,state.guest})
            {
                seat.deckId=Clean(seat.deckId);seat.deckName=Clean(seat.deckName);
                bool known=seat.balls!=null&&seat.balls.Length==9&&seat.balls.All(id=>!string.IsNullOrEmpty(id)&&catalog!=null&&catalog.Ball(id)!=null);
                if(!known){seat.balls=new string[0];seat.ready=false;}
                if(seat.wins<0)seat.wins=0;
            }
            return true;
        }
    }
}
