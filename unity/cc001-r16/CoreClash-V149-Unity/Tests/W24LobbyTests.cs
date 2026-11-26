using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using CoreClash.Data;
using CoreClash.Networking;

// CC-001 W24, the brief of the owner's course project (2026-11-25): "before the game proper the
// players come to a lobby where they get ready; the game starts only when every one of them has
// confirmed; the host controls the start" - and after a match they can play again, play the next
// level or go back to the lobby. The room's own rules are MatchLobby (no transport, no Unity).
public static partial class Program
{
    static MatchLobby W24Room(out Catalog catalog,bool activeOnly=true)
    {
        catalog=W22Catalog(out _);
        var room=new MatchLobby(catalog,activeOnly);
        var deck=catalog.Roster.Decks[0];
        True(room.SetDeck(0,deck.id,deck.name,deck.balls));
        return room;
    }
    static LobbyChoice W24Choice(DeckDefinition deck,bool ready)=>new LobbyChoice{deckId=deck.id,deckName=deck.name,balls=(string[])deck.balls.Clone(),ready=ready,color=3};

    static void W24LobbyTests()
    {
        Test("W24 lobby: the host starts only when both players are in, have a deck and have said ready",()=>{
            var room=W24Room(out var c);var theirs=c.Roster.Decks[1];
            Eq(LobbyBlock.NoGuest,room.Blocked);False(room.CanStart);False(room.Start());
            // Nobody to play: the guest's message is not taken before the guest has a seat.
            False(room.Apply(W24Choice(theirs,true)));
            room.GuestJoined();
            Eq(LobbyBlock.GuestDeck,room.Blocked);
            True(room.Apply(W24Choice(theirs,false)));
            Eq(LobbyBlock.GuestNotReady,room.Blocked);False(room.Start());
            True(room.Apply(W24Choice(theirs,true)));True(room.State.guest.ready);
            // The guest is ready, the host is not: still no start.
            Eq(LobbyBlock.HostNotReady,room.Blocked);False(room.Start());Eq(0,room.State.round);
            True(room.SetReady(0,true));
            Eq(LobbyBlock.None,room.Blocked);True(room.CanStart);
            True(room.Start());True(room.State.inMatch);Eq(1,room.State.round);
            // A running match is not started again.
            Eq(LobbyBlock.InMatch,room.Blocked);False(room.Start());Eq(1,room.State.round);
            // The match plays the two decks of the room.
            Eq(c.Roster.Decks[0].id,room.Deck(0).id);Eq(theirs.id,room.Deck(1).id);True(room.Deck(1).balls.SequenceEqual(theirs.balls));
        });

        Test("W24 lobby: a deck is nine different balls the game offers; another deck takes that player's ready back",()=>{
            var room=W24Room(out var c);room.GuestJoined();
            var good=c.Roster.Decks[2].balls;
            string frozen=c.Data.balls.First(b=>!c.IsActive(b.id)).id;
            False(room.ValidDeck(null));False(room.ValidDeck(good.Take(8).ToArray()));
            False(room.ValidDeck(good.Take(8).Concat(new[]{good[0]}).ToArray()));  // the same ball twice
            False(room.ValidDeck(good.Take(8).Concat(new[]{"no_such_ball"}).ToArray()));
            False(room.ValidDeck(good.Take(8).Concat(new[]{frozen}).ToArray()));  // a ball outside the active roster
            True(room.ValidDeck(good));
            // The developer roster's room takes every ball of the catalog.
            True(new MatchLobby(c,false).ValidDeck(good.Take(8).Concat(new[]{frozen}).ToArray()));
            // A refused deck changes nothing.
            int revision=room.State.revision;
            False(room.SetDeck(1,"x","x",good.Take(8).ToArray()));Eq(revision,room.State.revision);Eq(0,room.State.guest.balls.Length);
            False(room.SetDeck(2,"x","x",good));False(room.SetDeck(-1,"x","x",good));
            True(room.SetDeck(1,c.Roster.Decks[2].id,"Two",good));True(room.SetReady(1,true));True(room.SetReady(0,true));True(room.CanStart);
            // The same deck again: nothing to confirm anew.
            True(room.SetDeck(1,c.Roster.Decks[2].id,"Two",good));True(room.State.guest.ready);
            // Another deck: the guest confirms again; the host's word stands.
            True(room.SetDeck(1,c.Roster.Decks[3].id,"Three",c.Roster.Decks[3].balls));
            False(room.State.guest.ready);True(room.State.host.ready);False(room.CanStart);
            // And the host's other deck takes the host's word back.
            True(room.SetReady(1,true));True(room.SetDeck(0,c.Roster.Decks[4].id,"Four",c.Roster.Decks[4].balls));
            False(room.State.host.ready);True(room.State.guest.ready);False(room.CanStart);
        });

        Test("W24 lobby: ready without a deck is not taken; the guest's message reaches only the guest's seat",()=>{
            var room=W24Room(out var c);room.GuestJoined();
            False(room.SetReady(1,true));False(room.State.guest.ready);
            // "Ready" with a deck the room refuses: neither is taken.
            room.Apply(new LobbyChoice{deckId="x",balls=new[]{"a","b"},ready=true});
            False(room.State.guest.ready);Eq(0,room.State.guest.balls.Length);
            var hostDeck=room.State.host.balls.ToArray();bool hostReady=room.State.host.ready;
            True(room.Apply(W24Choice(c.Roster.Decks[1],true)));
            True(room.State.guest.ready);True(room.State.host.balls.SequenceEqual(hostDeck));Eq(hostReady,room.State.host.ready);
            // Text from the other side is cut to size and loses control characters.
            True(room.SetDeck(1,"id\n"+new string('x',90),"na\tme"+new string('y',90),c.Roster.Decks[1].balls));
            Eq(MatchLobby.MaxText,room.State.guest.deckId.Length);Eq(MatchLobby.MaxText,room.State.guest.deckName.Length);
            False(room.State.guest.deckId.Contains("\n"));False(room.State.guest.deckName.Contains("\t"));
            // During a match the room does not change.
            True(room.SetReady(1,true));True(room.SetReady(0,true));True(room.Start());
            int revision=room.State.revision;
            False(room.Apply(W24Choice(c.Roster.Decks[3],false)));False(room.SetDeck(0,"x","x",c.Roster.Decks[3].balls));False(room.SetReady(0,false));
            Eq(revision,room.State.revision);True(room.Deck(1).balls.SequenceEqual(c.Roster.Decks[1].balls));
        });

        Test("W24 lobby: other rules take the guest's ready back; the same rules change nothing",()=>{
            var room=W24Room(out var c);room.GuestJoined();room.SetRules("open",1.5f,true);
            True(room.Apply(W24Choice(c.Roster.Decks[1],true)));True(room.SetReady(0,true));True(room.CanStart);
            int revision=room.State.revision;
            room.SetRules("open",1.5f,true);Eq(revision,room.State.revision);True(room.CanStart);
            room.SetRules("pillars",1.5f,true);
            False(room.State.guest.ready);True(room.State.host.ready);Eq(LobbyBlock.GuestNotReady,room.Blocked);Eq("pillars",room.State.map);
            True(room.SetReady(1,true));room.SetRules("pillars",2f,true);False(room.State.guest.ready);
            True(room.SetReady(1,true));room.SetRules("pillars",2f,false);False(room.State.guest.ready);
        });

        Test("W24 lobby: a result counts once; a rematch keeps the decks; back in the lobby everybody confirms again",()=>{
            var room=W24Room(out var c);room.GuestJoined();
            True(room.Apply(W24Choice(c.Roster.Decks[1],true)));True(room.SetReady(0,true));
            // No match, no result and no rematch.
            room.Finish(0);Eq(0,room.State.host.wins);False(room.Rematch());
            True(room.Start());
            room.Finish(0);room.Finish(0);room.Finish(1);
            Eq(1,room.State.host.wins);Eq(0,room.State.guest.wins);
            True(room.Rematch());Eq(2,room.State.round);True(room.State.inMatch);
            True(room.Deck(0).balls.SequenceEqual(c.Roster.Decks[0].balls));True(room.Deck(1).balls.SequenceEqual(c.Roster.Decks[1].balls));
            room.Finish(1);room.Finish(1);
            Eq(1,room.State.host.wins);Eq(1,room.State.guest.wins);
            // A draw is nobody's win.
            True(room.Rematch());room.Finish(-1);Eq(1,room.State.host.wins);Eq(1,room.State.guest.wins);
            room.ReturnToLobby();
            False(room.State.inMatch);False(room.State.host.ready);False(room.State.guest.ready);
            Eq(LobbyBlock.GuestNotReady,room.Blocked);False(room.Start());
            // The decks and the score stay; a new deck may be picked now.
            Eq(1,room.State.host.wins);Eq(1,room.State.guest.wins);True(room.SetDeck(1,c.Roster.Decks[5].id,"Five",c.Roster.Decks[5].balls));
            True(room.SetReady(1,true));True(room.SetReady(0,true));True(room.Start());Eq(4,room.State.round);
            // A match left for the lobby before its end has no result.
            room.ReturnToLobby();Eq(1,room.State.host.wins);Eq(1,room.State.guest.wins);
        });

        Test("W24 lobby: a guest who leaves the lobby empties the seat; in a match the seat keeps its deck",()=>{
            var room=W24Room(out var c);room.GuestJoined();
            True(room.Apply(W24Choice(c.Roster.Decks[1],true)));True(room.SetReady(0,true));
            room.SetColors(2,5);
            room.GuestLeft();
            False(room.State.guest.present);Eq(0,room.State.guest.balls.Length);False(room.State.guest.ready);
            // The host agreed to play that guest: with the next one the host confirms again.
            False(room.State.host.ready);Eq(LobbyBlock.NoGuest,room.Blocked);Eq(5,room.State.guest.color);
            int revision=room.State.revision;room.GuestLeft();Eq(revision,room.State.revision);
            // The next guest: a clean seat and a new session.
            room.GuestJoined();True(room.Apply(W24Choice(c.Roster.Decks[1],true)));True(room.SetReady(0,true));True(room.Start());
            room.Finish(1);Eq(1,room.State.guest.wins);
            // Leaving during a match: the match and its deck go on, the seat is open.
            room.GuestLeft();
            False(room.State.guest.present);True(room.State.inMatch);True(room.Deck(1).balls.SequenceEqual(c.Roster.Decks[1].balls));
            False(room.Rematch());  // a rematch against nobody
            room.GuestJoined();
            True(room.State.guest.present);True(room.Deck(1).balls.SequenceEqual(c.Roster.Decks[1].balls));Eq(1,room.State.guest.wins);
            True(room.Rematch());
            // Back in the lobby a guest who leaves takes the session's score along.
            room.ReturnToLobby();room.GuestLeft();room.GuestJoined();
            Eq(0,room.State.host.wins);Eq(0,room.State.guest.wins);Eq(0,room.State.round);Eq(0,room.State.guest.balls.Length);
        });

        Test("W24 lobby: a match's two decks never share an id; a ready-made deck's id is kept only for that deck",()=>{
            var room=W24Room(out var c,false);room.GuestJoined();
            var first=c.Roster.Decks[0];var second=c.Roster.Decks[1];
            Eq(first.id,room.Deck(0).id);True(ReferenceEquals(first,room.Deck(0)),"the game's own deck");
            // Both players built a deck: on their own devices both are "custom_0".
            var mixA=first.balls.Take(5).Concat(second.balls.Take(4)).ToArray();var mixB=second.balls.Take(5).Concat(first.balls.Take(4)).ToArray();
            True(room.SetDeck(0,"custom_0","Mine",mixA));True(room.SetDeck(1,"custom_0","Mine",mixB));
            Eq("custom_0",room.Deck(0).id);Eq("custom_1",room.Deck(1).id);
            True(room.Deck(0).balls.SequenceEqual(mixA));True(room.Deck(1).balls.SequenceEqual(mixB));
            // A ready-made deck's id on other balls does not make it that deck.
            True(room.SetDeck(1,second.id,second.name,mixB));
            Eq("custom_1",room.Deck(1).id);True(room.Deck(1).balls.SequenceEqual(mixB));
            // What comes back is a copy: changing it does not change the room.
            room.Deck(1).balls[0]="normal";Eq(mixB[0],room.State.guest.balls[0]);
        });

        Test("W24 lobby: a guest takes only a well-formed room from the host; the room fits one message",()=>{
            var room=W24Room(out var c);room.GuestJoined();room.SetRoom(new string('n',200));room.SetRules("corners",1.5f,true);room.SetColors(1,6);
            True(room.Apply(W24Choice(c.Roster.Decks[1],true)));True(room.SetReady(0,true));
            Eq(MatchLobby.MaxText,room.State.roomName.Length);
            var options=new JsonSerializerOptions{IncludeFields=true};
            string wire=JsonSerializer.Serialize(room.State,options);
            True(wire.Length<MatchLobby.MaxWire/2,"the room's message is "+wire.Length+" characters");
            var got=JsonSerializer.Deserialize<LobbyState>(wire,options);
            True(MatchLobby.Admit(got,c));
            Eq(room.State.revision,got.revision);Eq("corners",got.map);True(got.host.ready&&got.guest.ready&&got.guest.present);Eq(6,got.guest.color);
            True(got.guest.balls.SequenceEqual(c.Roster.Decks[1].balls));
            // The guest's screen asks the same question as the host's room.
            Eq(LobbyBlock.None,MatchLobby.BlockOf(got,balls=>balls!=null&&balls.Length==9));
            got.host.ready=false;Eq(LobbyBlock.HostNotReady,MatchLobby.BlockOf(got,balls=>balls!=null&&balls.Length==9));
            Eq(LobbyBlock.InMatch,MatchLobby.BlockOf(null,balls=>true));
            // Not a room at all.
            False(MatchLobby.Admit(null,c));
            False(MatchLobby.Admit(new LobbyState{protocol=MatchLobby.Protocol+1},c));
            False(MatchLobby.Admit(new LobbyState{host=null},c));False(MatchLobby.Admit(new LobbyState{guest=null},c));
            False(MatchLobby.Admit(new LobbyState{ballScale=float.NaN},c));False(MatchLobby.Admit(new LobbyState{revision=-1},c));
            // A room with nonsense in it is shown without the nonsense.
            var odd=new LobbyState{roomName="room\r\n"+new string('z',300),map=new string('m',99)};
            odd.guest.present=true;odd.guest.ready=true;odd.guest.balls=new[]{"normal","no_such_ball"};odd.guest.wins=-4;odd.guest.deckName=null;
            True(MatchLobby.Admit(odd,c));
            Eq(MatchLobby.MaxText,odd.roomName.Length);False(odd.roomName.Contains("\n"));Eq(MatchLobby.MaxText,odd.map.Length);
            Eq(0,odd.guest.balls.Length);False(odd.guest.ready);Eq(0,odd.guest.wins);Eq("",odd.guest.deckName);
        });

        Test("W24 source: a network session opens the room, the match's state goes out only during a match, and only the host speaks for the room",()=>{
            string Read(string f)=>File.ReadAllText(Path.Combine(projectRoot,f));
            string session=Read("Assets/CoreClash/Networking/NgoGameSession.cs"),bridge=Read("Assets/CoreClash/Networking/NgoRpcBridge.cs");
            // Hosting, joining and the relay all open the room; none starts a match.
            Eq(3,session.Split(new[]{"OpenRoom();app.BeginNetworkLobby(this);"},StringSplitOptions.None).Length-1);
            False(session.Contains("BeginNetworkGame"));
            True(session.Contains("if(!IsAuthority||authority==null||lobby==null||!lobby.State.inMatch||!IsConnected||Time.unscaledTime<nextSnapshot)return;"),"the match's state must wait for the start");
            True(session.Contains("if(!LobbyCanStart||!lobby.Start())return false;"),"the start must go through the room's rule");
            True(session.Contains("if(!lobbyKnown||!lobbyShown.inMatch)return;"),"a guest must not take a match's state in the lobby");
            // The room is the host's to tell; the guest's two messages go to the host and are checked by seat.
            True(bridge.Contains("if(!IsServer&&context.Receive.SenderClientId==Unity.Netcode.NetworkManager.ServerClientId)session.ReceiveLobby(json);"));
            True(bridge.Contains("public void LobbyChoiceRpc(string json,RpcParams context=default){if(IsServer)session.ReceiveLobbyChoice(context.Receive.SenderClientId,json);}"));
            True(bridge.Contains("public void LobbyRequestRpc(int request,RpcParams context=default){if(IsServer)session.ReceiveLobbyRequest(context.Receive.SenderClientId,request);}"));
            True(session.Contains("if(!IsAuthority||lobby==null||!seat.Owns(sender))return;"));
            True(session.Contains("json.Length>MatchLobby.MaxWire"));
            // A guest may ask for the lobby only when the match is over.
            True(session.Contains("if(request==MatchLobby.RequestLobby&&lobby.State.inMatch&&app.Simulation.State.phase==MatchPhase.Over)LobbyReturn();"));
            // Builds that speak of the room refuse builds that do not.
            True(session.Contains("nm.NetworkConfig.ProtocolVersion=150;"));True(Read("Assets/Scenes/CoreClash.unity").Contains("ProtocolVersion: 150"));
            // The screens: the room before the match, and the three ways on after it.
            string app=Read("Assets/CoreClash/Presentation/CoreClashApp.cs"),result=Read("Assets/CoreClash/Presentation/ResultView.cs"),lobby=Read("Assets/CoreClash/Presentation/LobbyView.cs");
            True(app.Contains("else if(inLobby)RenderLobby();"));
            True(lobby.Contains("room.LobbySetReady(!seat.ready)")&&lobby.Contains("room.LobbyStart()")&&lobby.Contains("live?room.LobbyCanStart:"));
            True(result.Contains("room.LobbyRematch(false)")&&result.Contains("room.LobbyRematch(true)")&&result.Contains("room.LobbyReturn()"));
        });
    }
}
