-- 워크스페이스 크레딧 잔액
create table workspace_credits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  balance integer not null default 0,  -- 원 단위 잔액
  auto_recharge boolean not null default false,
  auto_recharge_amount integer default null,  -- 자동충전 금액
  auto_recharge_threshold integer default null,  -- 이 금액 이하가 되면 자동충전
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id)
);

-- RLS
alter table workspace_credits enable row level security;

create policy "workspace_credits_select" on workspace_credits
  for select using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_credits_update" on workspace_credits
  for update using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

-- 크레딧 거래 내역
create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type text not null,  -- 'charge' | 'deduct' | 'refund' | 'auto_charge'
  amount integer not null,  -- 양수=충전, 음수=차감
  balance_after integer not null,  -- 거래 후 잔액
  description text,  -- "SMS 발송 50건", "크레딧 충전" 등
  campaign_id uuid references campaigns(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table credit_transactions enable row level security;

create policy "credit_transactions_select" on credit_transactions
  for select using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

-- 카카오 채널 연동 (워크스페이스별 — 중앙 Solapi 계정에 연동된 채널)
create table workspace_kakao_channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  pf_id text not null,
  search_id text not null,
  channel_name text not null,
  category_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workspace_id, pf_id)
);

alter table workspace_kakao_channels enable row level security;

create policy "workspace_kakao_channels_select" on workspace_kakao_channels
  for select using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_kakao_channels_insert" on workspace_kakao_channels
  for insert with check (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "workspace_kakao_channels_delete" on workspace_kakao_channels
  for delete using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

-- 메시지 단가 테이블
create table message_pricing (
  id uuid primary key default gen_random_uuid(),
  message_type text not null unique,  -- 'SMS', 'LMS', 'MMS', 'ATA', 'FT'
  unit_price integer not null,  -- 원 단위
  label text not null,
  updated_at timestamptz not null default now()
);

-- 기본 단가 삽입
insert into message_pricing (message_type, unit_price, label) values
  ('SMS', 18, '문자(SMS)'),
  ('LMS', 45, '장문(LMS)'),
  ('MMS', 110, '사진(MMS)'),
  ('ATA', 13, '알림톡'),
  ('FT', 15, '친구톡(브랜드메시지)');

-- 워크스페이스 생성 시 자동으로 크레딧 레코드 생성
create or replace function create_workspace_credits()
returns trigger as $$
begin
  insert into workspace_credits (workspace_id, balance)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workspace_created_credits
  after insert on workspaces
  for each row execute function create_workspace_credits();
