-- A game with no fictional setting still needs an explicit world classification
-- before it can be marked ready (e.g. abstract puzzle or board games).
INSERT INTO steam_catalog_terms (facet, slug, label)
VALUES ('world', 'abstract-no-setting', 'Abstract / No Setting')
ON CONFLICT (facet, slug) DO NOTHING;
