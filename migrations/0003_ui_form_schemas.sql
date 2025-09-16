CREATE TABLE IF NOT EXISTS ui_form_schemas (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  model      VARCHAR(100) NOT NULL,
  kind       ENUM('create','edit') NOT NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  version    INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_form_schema_model_kind_active (model, kind, is_active),
  KEY ix_form_schema_model_kind (model, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ui_form_schema_fields (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  schema_id    BIGINT UNSIGNED NOT NULL,
  field_name   VARCHAR(100)  NOT NULL,
  field_label  VARCHAR(255)  NOT NULL,
  widget       ENUM('input','number','select','switch','date','datetime','textarea','password','email') NOT NULL,
  data_type    ENUM('string','number','datetime','boolean') NOT NULL,
  required     TINYINT(1) NOT NULL DEFAULT 0,
  max_len      INT NULL,
  min_len      INT NULL,
  pattern      VARCHAR(255) NULL,
  placeholder  VARCHAR(255) NULL,
  order_no     INT NOT NULL DEFAULT 10,
  visible      TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_ui_form_schema_fields_schema
    FOREIGN KEY (schema_id) REFERENCES ui_form_schemas(id) ON DELETE CASCADE,
  UNIQUE KEY ux_form_schema_fieldname (schema_id, field_name),
  KEY ix_form_schema_fields_order (schema_id, order_no),
  KEY ix_form_schema_fields_visible (schema_id, visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ui_form_field_options (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  field_id  BIGINT UNSIGNED NOT NULL,
  opt_label VARCHAR(255) NOT NULL,
  opt_value VARCHAR(255) NOT NULL,
  order_no  INT NOT NULL DEFAULT 10,
  PRIMARY KEY (id),
  CONSTRAINT fk_ui_form_field_options_field
    FOREIGN KEY (field_id) REFERENCES ui_form_schema_fields(id) ON DELETE CASCADE,
  UNIQUE KEY ux_form_field_option (field_id, opt_value),
  KEY ix_form_field_option_order (field_id, order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
