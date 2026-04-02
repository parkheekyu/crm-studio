-- 순차 발송 시나리오의 발송 시각 (HH:MM 형식, 예: '09:00')
ALTER TABLE scenarios ADD COLUMN send_time TEXT DEFAULT '09:00';
