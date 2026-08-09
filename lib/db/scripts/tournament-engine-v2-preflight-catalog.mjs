export const REQUIRED_STAGE_CONSTRAINTS = Object.freeze([
  Object.freeze({
    name: "tournament_stages_elimination_advancing_boundary",
    definition:
      "CHECK (format <> 'single_elimination'::tournament_stage_format OR qualification_mode = 'none'::stage_qualification_mode OR qualification_mode = 'top_n'::stage_qualification_mode AND advancing_count < participant_count AND (advancing_count & (advancing_count - 1)) = 0)",
  }),
  Object.freeze({
    name: "tournament_stages_qualification_configuration",
    definition:
      "CHECK (qualification_mode = 'none'::stage_qualification_mode AND advancing_count IS NULL OR qualification_mode = 'top_n'::stage_qualification_mode AND (format = ANY (ARRAY['swiss'::tournament_stage_format, 'round_robin'::tournament_stage_format])) AND advancing_count IS NOT NULL AND advancing_count <= participant_count OR qualification_mode = 'top_n'::stage_qualification_mode AND format = 'single_elimination'::tournament_stage_format AND advancing_count IS NOT NULL OR qualification_mode = 'top_n_per_group'::stage_qualification_mode AND format = 'group_stage'::tournament_stage_format AND advancing_count IS NULL)",
  }),
]);

const DEFAULT_FUNCTION_ATTRIBUTES = Object.freeze({
  schema: "public",
  language: "plpgsql",
  securityDefiner: false,
  config: Object.freeze([]),
  volatility: "v",
  strict: false,
  leakproof: false,
  parallel: "u",
  returnsSet: false,
});

function functionDescriptor({
  name,
  identityArguments = "",
  result = "trigger",
  bodySha256,
}) {
  return Object.freeze({
    ...DEFAULT_FUNCTION_ATTRIBUTES,
    name,
    identityArguments,
    result,
    bodySha256,
  });
}

export const REQUIRED_STAGE_FUNCTIONS = Object.freeze([
  functionDescriptor({
    name: "compat_assign_action_log_stage",
    bodySha256: "d073e27ac8b721a76a252376f0f66a730c334be8b0351c9206276f882f60ee49",
  }),
  functionDescriptor({
    name: "compat_assign_result_history_stage",
    bodySha256: "b39d5a3770e2084909fb1cca995d0e801ced0e343a99997d87fedda922977132",
  }),
  functionDescriptor({
    name: "compat_assign_single_stage_match",
    bodySha256: "ec02d22f6e32d41ae1bf656448af32c5875a6b613cbbfc6025d685e2bdab3bf4",
  }),
  functionDescriptor({
    name: "compat_count_single_stage_participants_after_delete",
    bodySha256: "e64a0811ab565da28cbbc7936c2f913d741bf904f7de11a4ce6490ab3b7b1937",
  }),
  functionDescriptor({
    name: "compat_create_single_stage",
    bodySha256: "2cc46cddb16c95b01274a7cda53b8db05824df789e4a84a8bb5327838766a8c5",
  }),
  functionDescriptor({
    name: "compat_prepare_single_stage_player_seed",
    bodySha256: "dfa4c115e764e7dcbcb1b43f7f021ca6e6ef2ccf46ebedca0062f7cec91adddf",
  }),
  functionDescriptor({
    name: "compat_resequence_single_stage_participants",
    identityArguments: "target_tournament_id integer, target_stage_id integer",
    result: "void",
    bodySha256: "69501e18f1d030b11891650b5a8410849616cba5f1d596091d89eaefd455b389",
  }),
  functionDescriptor({
    name: "compat_sync_active_stage_pointer",
    bodySha256: "0f91ce1051d1126991e3e0706ea88dc3950315f24795a96d24aec77234e9198d",
  }),
  functionDescriptor({
    name: "compat_sync_single_stage_from_tournament",
    bodySha256: "5504caf10546429d8c957927117c4b63ebd32f8dd60e680f48c834caaaeac0a3",
  }),
  functionDescriptor({
    name: "compat_sync_single_stage_participant",
    bodySha256: "d6f96f4e330c99588aea3a1d12913f8f779323dedda51ee3e893e9e0ba9bd1e7",
  }),
  functionDescriptor({
    name: "prevent_last_tournament_stage_delete",
    bodySha256: "e638e63cb3e7252c344cb1dea657633b13d3f2840a971aeee0cf4bd9eab5bd07",
  }),
  functionDescriptor({
    name: "validate_active_stage_pointer",
    bodySha256: "bed19d4f71e0cab33a6a16f1c30227078b6f633d6401a3bc8ee55977dc23a4c8",
  }),
  functionDescriptor({
    name: "validate_single_stage_lifecycle_alignment",
    bodySha256: "9d2c35c16dc9e18722b2af874903f4caa8be6dd6ed4c697c3a105d53fc8d3881",
  }),
  functionDescriptor({
    name: "validate_stage_group_configuration",
    bodySha256: "18b713de3a6b3be9ba3fdec93d334f5747991295b068e8c2f76e35b3ea935b8f",
  }),
  functionDescriptor({
    name: "validate_tournament_stage_participant_flow",
    bodySha256: "f8e8e49624843eab44c028e9f2f887a1ab43f4aa8c383f2c62fa572009085c9c",
  }),
]);

function triggerDescriptor({ name, table, definition }) {
  return Object.freeze({
    schema: "public",
    name,
    table,
    enabled: "O",
    definition,
  });
}

export const REQUIRED_STAGE_TRIGGERS = Object.freeze([
  triggerDescriptor({
    name: "action_log_assign_stage",
    table: "action_log",
    definition:
      "CREATE TRIGGER action_log_assign_stage BEFORE INSERT OR UPDATE OF match_id, stage_id ON action_log FOR EACH ROW EXECUTE FUNCTION compat_assign_action_log_stage()",
  }),
  triggerDescriptor({
    name: "matches_assign_single_stage",
    table: "matches",
    definition:
      "CREATE TRIGGER matches_assign_single_stage BEFORE INSERT OR UPDATE OF tournament_id, stage_id ON matches FOR EACH ROW EXECUTE FUNCTION compat_assign_single_stage_match()",
  }),
  triggerDescriptor({
    name: "players_count_single_stage_after_delete",
    table: "players",
    definition:
      "CREATE TRIGGER players_count_single_stage_after_delete AFTER DELETE ON players FOR EACH ROW EXECUTE FUNCTION compat_count_single_stage_participants_after_delete()",
  }),
  triggerDescriptor({
    name: "players_prepare_single_stage_seed",
    table: "players",
    definition:
      "CREATE TRIGGER players_prepare_single_stage_seed BEFORE INSERT OR UPDATE OF seed ON players FOR EACH ROW EXECUTE FUNCTION compat_prepare_single_stage_player_seed()",
  }),
  triggerDescriptor({
    name: "players_sync_single_stage_participant",
    table: "players",
    definition:
      "CREATE TRIGGER players_sync_single_stage_participant AFTER INSERT OR UPDATE OF seed, status ON players FOR EACH ROW EXECUTE FUNCTION compat_sync_single_stage_participant()",
  }),
  triggerDescriptor({
    name: "result_history_assign_stage",
    table: "result_history",
    definition:
      "CREATE TRIGGER result_history_assign_stage BEFORE INSERT OR UPDATE OF match_id, stage_id ON result_history FOR EACH ROW EXECUTE FUNCTION compat_assign_result_history_stage()",
  }),
  triggerDescriptor({
    name: "stage_groups_validate_configuration",
    table: "stage_groups",
    definition:
      "CREATE TRIGGER stage_groups_validate_configuration BEFORE INSERT OR UPDATE OF stage_id, \"position\", participant_count, qualifiers_count ON stage_groups FOR EACH ROW EXECUTE FUNCTION validate_stage_group_configuration()",
  }),
  triggerDescriptor({
    name: "tournament_stages_require_at_least_one",
    table: "tournament_stages",
    definition:
      "CREATE CONSTRAINT TRIGGER tournament_stages_require_at_least_one AFTER DELETE ON tournament_stages DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION prevent_last_tournament_stage_delete()",
  }),
  triggerDescriptor({
    name: "tournament_stages_sync_active_pointer",
    table: "tournament_stages",
    definition:
      "CREATE TRIGGER tournament_stages_sync_active_pointer AFTER INSERT OR UPDATE OF status ON tournament_stages FOR EACH ROW EXECUTE FUNCTION compat_sync_active_stage_pointer()",
  }),
  triggerDescriptor({
    name: "tournament_stages_validate_participant_flow",
    table: "tournament_stages",
    definition:
      "CREATE CONSTRAINT TRIGGER tournament_stages_validate_participant_flow AFTER INSERT OR DELETE OR UPDATE ON tournament_stages DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_tournament_stage_participant_flow()",
  }),
  triggerDescriptor({
    name: "tournaments_create_single_stage",
    table: "tournaments",
    definition:
      "CREATE TRIGGER tournaments_create_single_stage AFTER INSERT ON tournaments FOR EACH ROW EXECUTE FUNCTION compat_create_single_stage()",
  }),
  triggerDescriptor({
    name: "tournaments_sync_single_stage",
    table: "tournaments",
    definition:
      "CREATE TRIGGER tournaments_sync_single_stage AFTER UPDATE OF format, status, default_best_of, swiss_rounds, current_round, total_rounds, winner_id ON tournaments FOR EACH ROW EXECUTE FUNCTION compat_sync_single_stage_from_tournament()",
  }),
  triggerDescriptor({
    name: "tournaments_validate_active_stage_pointer",
    table: "tournaments",
    definition:
      "CREATE TRIGGER tournaments_validate_active_stage_pointer BEFORE UPDATE OF active_stage_id ON tournaments FOR EACH ROW EXECUTE FUNCTION validate_active_stage_pointer()",
  }),
  triggerDescriptor({
    name: "tournaments_validate_single_stage_lifecycle",
    table: "tournaments",
    definition:
      "CREATE CONSTRAINT TRIGGER tournaments_validate_single_stage_lifecycle AFTER INSERT OR UPDATE ON tournaments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validate_single_stage_lifecycle_alignment()",
  }),
]);
