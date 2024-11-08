export const idlFactory = ({ IDL }) => {
  const GameState = IDL.Record({
    'startTime' : IDL.Int,
    'treasuresFound' : IDL.Nat,
    'gameId' : IDL.Text,
    'isActive' : IDL.Bool,
    'score' : IDL.Nat,
  });
  return IDL.Service({
    'checkLocation' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Bool], []),
    'endGame' : IDL.Func([], [], []),
    'getGameState' : IDL.Func([], [IDL.Opt(GameState)], ['query']),
    'getHighScores' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
        ['query'],
      ),
    'getRemainingTime' : IDL.Func([], [IDL.Int], ['query']),
    'startGame' : IDL.Func([], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
