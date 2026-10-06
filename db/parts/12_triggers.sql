-- =========================================================================
-- PART 12 : triggers (progress + notifications without app code)
-- trg_tasks_progress : any task change recalculates packet + employee pct.
-- trg_tasks_reviews  : approve/reject writes the employee bell alert.
-- trg_messages_notify: new chat message notifies the other side
--                      (employee msg -> all HR; HR msg -> the employee).
-- Requires: parts 02, 04, 08, 09.
-- =========================================================================
USE hr_onboarding;

DELIMITER $$

CREATE TRIGGER trg_tasks_progress
AFTER UPDATE ON onboarding_tasks FOR EACH ROW
BEGIN
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_ok INT DEFAULT 0;
  DECLARE v_pct INT DEFAULT 0;
  SELECT COUNT(*), COUNT(CASE WHEN status = 'approved' THEN 1 END)
    INTO v_total, v_ok
  FROM onboarding_tasks
  WHERE packet_id = NEW.packet_id AND required = 1;
  IF v_total > 0 THEN SET v_pct = ROUND(v_ok * 100 / v_total);
  ELSE SET v_pct = 100; END IF;
  UPDATE onboarding_packets
    SET completion_pct = v_pct,
        completed_at = CASE WHEN v_pct = 100 THEN NOW() ELSE NULL END
  WHERE id = NEW.packet_id;
  UPDATE employees SET completion_pct = v_pct WHERE id = NEW.employee_id;
END$$

CREATE TRIGGER trg_tasks_reviews
AFTER UPDATE ON onboarding_tasks FOR EACH ROW
BEGIN
  IF NEW.status = 'needs_changes' AND OLD.status <> 'needs_changes' THEN
    INSERT INTO notifications (user_id, type, title, body, link_section, task_id)
    VALUES (NEW.employee_id, 'rejection',
            CONCAT(NEW.title, ' needs changes.'),
            NEW.feedback,
            CASE NEW.category
              WHEN 'photo' THEN 'photo' WHEN 'medical' THEN 'medical'
              WHEN 'first_day' THEN 'first_day' WHEN 'privacy' THEN 'privacy'
              WHEN 'form' THEN 'forms' WHEN 'help' THEN 'help'
              ELSE 'pre_employment' END,
            NEW.id);
  END IF;
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    INSERT INTO notifications (user_id, type, title, body, link_section, task_id)
    VALUES (NEW.employee_id, 'approval',
            CONCAT(NEW.title, ' approved.'),
            'HR approved your submission. Nice work.',
            CASE NEW.category
              WHEN 'photo' THEN 'photo' WHEN 'medical' THEN 'medical'
              WHEN 'first_day' THEN 'first_day' WHEN 'privacy' THEN 'privacy'
              WHEN 'form' THEN 'forms' WHEN 'help' THEN 'help'
              ELSE 'pre_employment' END,
            NEW.id);
  END IF;
END$$

CREATE TRIGGER trg_messages_notify
AFTER INSERT ON messages FOR EACH ROW
BEGIN
  DECLARE v_emp CHAR(36);
  DECLARE v_title VARCHAR(255);
  SELECT employee_id INTO v_emp FROM message_threads WHERE id = NEW.thread_id;
  SELECT CONCAT('New message: ', subject_title) INTO v_title
    FROM message_threads WHERE id = NEW.thread_id;
  IF NEW.sender_role = 'employee' THEN
    INSERT INTO notifications (user_id, type, title, body, link_section)
    SELECT u.id, 'chat', v_title, LEFT(NEW.body, 200), 'help'
    FROM users u WHERE u.role IN ('hr_manager', 'hr_assistant');
  ELSE
    INSERT INTO notifications (user_id, type, title, body, link_section)
    VALUES (v_emp, 'chat', v_title, LEFT(NEW.body, 200), 'help');
  END IF;
END$$

DELIMITER ;
