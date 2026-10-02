WITH ranked AS MATERIALIZED (
	SELECT p.id,
		FIRST_VALUE(p.id) OVER w AS keeper_id,
		ROW_NUMBER() OVER w AS rn
	FROM predictions p
	WHERE p.race_id IS NOT NULL
	WINDOW w AS (
		PARTITION BY p.member_id, p.group_id, p.race_id
		ORDER BY (SELECT COUNT(*) FROM prediction_entries e WHERE e.prediction_id = p.id) DESC, p.created_at ASC, p.id ASC
	)
),
moves AS MATERIALIZED (
	SELECT e.id, r.keeper_id,
		ROW_NUMBER() OVER (PARTITION BY r.keeper_id, e.position ORDER BY r.rn, e.id) AS pos_rn
	FROM prediction_entries e
	JOIN ranked r ON r.id = e.prediction_id
	WHERE r.rn > 1
		AND NOT EXISTS (
			SELECT 1 FROM prediction_entries k
			WHERE k.prediction_id = r.keeper_id AND k.position = e.position
		)
)
UPDATE prediction_entries
SET prediction_id = moves.keeper_id
FROM moves
WHERE moves.id = prediction_entries.id AND moves.pos_rn = 1;
--> statement-breakpoint
WITH ranked AS MATERIALIZED (
	SELECT p.id,
		FIRST_VALUE(p.id) OVER w AS keeper_id,
		ROW_NUMBER() OVER w AS rn
	FROM predictions p
	WHERE p.race_id IS NOT NULL
	WINDOW w AS (
		PARTITION BY p.member_id, p.group_id, p.race_id
		ORDER BY (SELECT COUNT(*) FROM prediction_entries e WHERE e.prediction_id = p.id) DESC, p.created_at ASC, p.id ASC
	)
)
DELETE FROM prediction_entries
WHERE prediction_id IN (SELECT id FROM ranked WHERE rn > 1);
--> statement-breakpoint
WITH ranked AS MATERIALIZED (
	SELECT p.id,
		FIRST_VALUE(p.id) OVER w AS keeper_id,
		ROW_NUMBER() OVER w AS rn
	FROM predictions p
	WHERE p.race_id IS NOT NULL
	WINDOW w AS (
		PARTITION BY p.member_id, p.group_id, p.race_id
		ORDER BY (SELECT COUNT(*) FROM prediction_entries e WHERE e.prediction_id = p.id) DESC, p.created_at ASC, p.id ASC
	)
)
DELETE FROM predictions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
--> statement-breakpoint
WITH ranked AS MATERIALIZED (
	SELECT p.id,
		FIRST_VALUE(p.id) OVER w AS keeper_id,
		ROW_NUMBER() OVER w AS rn
	FROM predictions p
	WHERE p.is_for_championship = 1
	WINDOW w AS (
		PARTITION BY p.member_id, p.group_id
		ORDER BY (SELECT COUNT(*) FROM prediction_entries e WHERE e.prediction_id = p.id) DESC, p.created_at ASC, p.id ASC
	)
),
moves AS MATERIALIZED (
	SELECT e.id, r.keeper_id,
		ROW_NUMBER() OVER (PARTITION BY r.keeper_id, e.position ORDER BY r.rn, e.id) AS pos_rn
	FROM prediction_entries e
	JOIN ranked r ON r.id = e.prediction_id
	WHERE r.rn > 1
		AND NOT EXISTS (
			SELECT 1 FROM prediction_entries k
			WHERE k.prediction_id = r.keeper_id AND k.position = e.position
		)
)
UPDATE prediction_entries
SET prediction_id = moves.keeper_id
FROM moves
WHERE moves.id = prediction_entries.id AND moves.pos_rn = 1;
--> statement-breakpoint
WITH ranked AS MATERIALIZED (
	SELECT p.id,
		FIRST_VALUE(p.id) OVER w AS keeper_id,
		ROW_NUMBER() OVER w AS rn
	FROM predictions p
	WHERE p.is_for_championship = 1
	WINDOW w AS (
		PARTITION BY p.member_id, p.group_id
		ORDER BY (SELECT COUNT(*) FROM prediction_entries e WHERE e.prediction_id = p.id) DESC, p.created_at ASC, p.id ASC
	)
)
DELETE FROM prediction_entries
WHERE prediction_id IN (SELECT id FROM ranked WHERE rn > 1);
--> statement-breakpoint
WITH ranked AS MATERIALIZED (
	SELECT p.id,
		FIRST_VALUE(p.id) OVER w AS keeper_id,
		ROW_NUMBER() OVER w AS rn
	FROM predictions p
	WHERE p.is_for_championship = 1
	WINDOW w AS (
		PARTITION BY p.member_id, p.group_id
		ORDER BY (SELECT COUNT(*) FROM prediction_entries e WHERE e.prediction_id = p.id) DESC, p.created_at ASC, p.id ASC
	)
)
DELETE FROM predictions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
--> statement-breakpoint
CREATE UNIQUE INDEX `predictions_member_group_race_uq` ON `predictions` (`member_id`,`group_id`,`race_id`) WHERE race_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `predictions_member_group_championship_uq` ON `predictions` (`member_id`,`group_id`) WHERE is_for_championship = 1;