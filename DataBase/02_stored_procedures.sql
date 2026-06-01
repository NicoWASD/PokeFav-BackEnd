USE `pokefav`;

DELIMITER //

-- Obtener usuario por email
DROP PROCEDURE IF EXISTS sp_GetUserByEmail //
CREATE PROCEDURE sp_GetUserByEmail(IN p_email VARCHAR(255))
BEGIN
  SELECT * FROM users WHERE email = p_email;
END //

-- Registrar un nuevo usuario
DROP PROCEDURE IF EXISTS sp_RegisterUser //
CREATE PROCEDURE sp_RegisterUser(
  IN p_name VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_otp_code VARCHAR(6)
)
BEGIN
  INSERT INTO users (name, email, password_hash, otp_code)
  VALUES (p_name, p_email, p_password_hash, p_otp_code);
END //

-- Verificar un usuario
DROP PROCEDURE IF EXISTS sp_VerifyUser //
CREATE PROCEDURE sp_VerifyUser(IN p_email VARCHAR(255))
BEGIN
  UPDATE users SET is_verified = true, otp_code = NULL WHERE email = p_email;
END //

-- Actualizar código OTP
DROP PROCEDURE IF EXISTS sp_UpdateOTP //
CREATE PROCEDURE sp_UpdateOTP(IN p_email VARCHAR(255), IN p_otp_code VARCHAR(6))
BEGIN
  UPDATE users SET otp_code = p_otp_code WHERE email = p_email;
END //

-- Resetear Contraseña
DROP PROCEDURE IF EXISTS sp_ResetPassword //
CREATE PROCEDURE sp_ResetPassword(IN p_email VARCHAR(255), IN p_password_hash VARCHAR(255))
BEGIN
  UPDATE users SET password_hash = p_password_hash, otp_code = NULL WHERE email = p_email;
END //

-- FAVORITOS
DROP PROCEDURE IF EXISTS sp_GetFavorites //
CREATE PROCEDURE sp_GetFavorites(IN p_user_id INT)
BEGIN
  SELECT pokemon_id FROM favorites WHERE user_id = p_user_id;
END //

DROP PROCEDURE IF EXISTS sp_AddFavorite //
CREATE PROCEDURE sp_AddFavorite(IN p_user_id INT, IN p_pokemon_id INT)
BEGIN
  INSERT IGNORE INTO favorites (user_id, pokemon_id) VALUES (p_user_id, p_pokemon_id);
END //

DROP PROCEDURE IF EXISTS sp_RemoveFavorite //
CREATE PROCEDURE sp_RemoveFavorite(IN p_user_id INT, IN p_pokemon_id INT)
BEGIN
  DELETE FROM favorites WHERE user_id = p_user_id AND pokemon_id = p_pokemon_id;
END //

-- EQUIPOS
DROP PROCEDURE IF EXISTS sp_GetTeams //
CREATE PROCEDURE sp_GetTeams(IN p_user_id INT)
BEGIN
  SELECT id, name FROM teams WHERE user_id = p_user_id;
END //

DROP PROCEDURE IF EXISTS sp_CreateTeam //
CREATE PROCEDURE sp_CreateTeam(IN p_user_id INT, IN p_name VARCHAR(255))
BEGIN
  INSERT INTO teams (user_id, name) VALUES (p_user_id, p_name);
  SELECT LAST_INSERT_ID() as team_id;
END //

DROP PROCEDURE IF EXISTS sp_DeleteTeam //
CREATE PROCEDURE sp_DeleteTeam(IN p_user_id INT, IN p_team_id INT)
BEGIN
  DELETE FROM teams WHERE id = p_team_id AND user_id = p_user_id;
END //

-- MIEMBROS DE EQUIPO
DROP PROCEDURE IF EXISTS sp_GetTeamMembers //
CREATE PROCEDURE sp_GetTeamMembers(IN p_team_id INT)
BEGIN
  SELECT pokemon_id FROM team_members WHERE team_id = p_team_id;
END //

DROP PROCEDURE IF EXISTS sp_AddTeamMember //
CREATE PROCEDURE sp_AddTeamMember(IN p_user_id INT, IN p_team_id INT, IN p_pokemon_id INT)
BEGIN
  DECLARE v_is_owner INT;
  DECLARE member_count INT;
  
  -- Check if user owns the team
  SELECT COUNT(*) INTO v_is_owner FROM teams WHERE id = p_team_id AND user_id = p_user_id;
  
  IF v_is_owner > 0 THEN
    SELECT COUNT(*) INTO member_count FROM team_members WHERE team_id = p_team_id;
    IF member_count < 6 THEN
      INSERT IGNORE INTO team_members (team_id, pokemon_id) VALUES (p_team_id, p_pokemon_id);
    END IF;
  END IF;
END //

DROP PROCEDURE IF EXISTS sp_RemoveTeamMember //
CREATE PROCEDURE sp_RemoveTeamMember(IN p_user_id INT, IN p_team_id INT, IN p_pokemon_id INT)
BEGIN
  DELETE tm FROM team_members tm
  INNER JOIN teams t ON tm.team_id = t.id
  WHERE t.id = p_team_id AND t.user_id = p_user_id AND tm.pokemon_id = p_pokemon_id;
END //

DELIMITER ;
