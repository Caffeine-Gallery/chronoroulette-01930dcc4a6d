import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface GameState {
  'startTime' : bigint,
  'treasuresFound' : bigint,
  'gameId' : string,
  'isActive' : boolean,
  'score' : bigint,
}
export interface _SERVICE {
  'checkLocation' : ActorMethod<[bigint, bigint], boolean>,
  'endGame' : ActorMethod<[], undefined>,
  'getGameState' : ActorMethod<[], [] | [GameState]>,
  'getHighScores' : ActorMethod<[], Array<[string, bigint]>>,
  'getRemainingTime' : ActorMethod<[], bigint>,
  'startGame' : ActorMethod<[], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
