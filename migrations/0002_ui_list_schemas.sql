-- Logical schema (one active row per model)
CREATE TABLE IF NOT EXISTS ui_list_schemas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_ui_list_schemas_model_active (model, is_active),
  KEY ix_ui_list_schemas_model (model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Field definitions (normalized — no JSON)
CREATE TABLE IF NOT EXISTS ui_list_schema_fields (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  schema_id BIGINT UNSIGNED NOT NULL,
  field_name  VARCHAR(100)  NOT NULL,          -- e.g. "name"
  field_label VARCHAR(255)  NOT NULL,          -- e.g. "Name"
  field_type  ENUM('string','number','datetime','boolean') NOT NULL,
  width       INT NULL,                         -- px; NULL => auto
  align       ENUM('left','right','center') NOT NULL DEFAULT 'left',
  sortable    TINYINT(1) NOT NULL DEFAULT 0,
  searchable  TINYINT(1) NOT NULL DEFAULT 0,
  order_no    INT NOT NULL DEFAULT 10,          -- display order (default 10)
  visible     TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_ui_list_schema_fields_schema
    FOREIGN KEY (schema_id) REFERENCES ui_list_schemas(id) ON DELETE CASCADE,
  UNIQUE KEY ux_schema_field_name (schema_id, field_name),
  KEY ix_schema_order (schema_id, order_no),
  KEY ix_schema_visible (schema_id, visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
