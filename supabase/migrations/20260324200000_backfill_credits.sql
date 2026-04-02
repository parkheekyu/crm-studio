-- 기존 워크스페이스에 credit 레코드가 없으면 생성
insert into workspace_credits (workspace_id, balance)
select w.id, 0
from workspaces w
where not exists (
  select 1 from workspace_credits wc where wc.workspace_id = w.id
);
