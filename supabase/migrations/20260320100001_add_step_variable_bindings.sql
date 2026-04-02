-- scenario_steps에 변수 바인딩 JSONB 컬럼 추가
-- 형식: { "이름": { "type": "field", "value": "name" }, "링크": { "type": "fixed", "value": "https://..." } }
ALTER TABLE scenario_steps ADD COLUMN variable_bindings JSONB DEFAULT '{}';
