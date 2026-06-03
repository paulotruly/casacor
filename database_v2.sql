CREATE DATABASE IF NOT EXISTS sonora_bench;
USE sonora_bench;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    liftx_token VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS user_classifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    color_name VARCHAR(50) NOT NULL,
    color_hex VARCHAR(7) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_class (user_id, class_name)
);

CREATE TABLE IF NOT EXISTS access_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id)
);

-- =========================
-- 3. DML - INSERTS
-- =========================

INSERT INTO users (email, hashed_password, created_at, liftx_token) VALUES
('paulo@email.com', 'hash123', '2026-06-01 10:00:00', 'token_lifx_paulo'),
('aline@email.com', 'hash456', '2026-06-01 11:30:00', NULL),
('lucas@email.com', 'hash789', '2026-06-02 09:15:00', 'token_lifx_lucas'),
('maria@email.com', 'hash321', '2026-06-03 14:20:00', NULL);

INSERT INTO user_classifications 
(user_id, class_name, color_name, color_hex, is_active) VALUES
(1, 'Relaxamento', 'Azul', '#0000FF', TRUE),
(1, 'Foco', 'Verde', '#00FF00', TRUE),
(1, 'Alerta', 'Vermelho', '#FF0000', FALSE),
(2, 'Estudo', 'Amarelo', '#FFFF00', TRUE),
(2, 'Descanso', 'Roxo', '#800080', TRUE),
(3, 'Trabalho', 'Branco', '#FFFFFF', TRUE),
(3, 'Sono', 'Laranja', '#FFA500', FALSE);

INSERT INTO access_logs (user_id, login_time, ip_address) VALUES
(1, '2026-06-01 10:05:00', '192.168.0.10'),
(1, '2026-06-02 18:30:00', '192.168.0.10'),
(1, '2026-06-03 20:15:00', '192.168.0.11'),
(2, '2026-06-01 12:00:00', '192.168.0.20'),
(2, '2026-06-03 09:45:00', '192.168.0.20'),
(3, '2026-06-02 10:10:00', '192.168.0.30');

INSERT INTO user_preferences 
(user_id, theme, notifications_enabled) VALUES
(1, 'dark', TRUE),
(2, 'light', FALSE),
(3, 'dark', TRUE);

-- =========================
-- 4. DQL - CONSULTAS
-- =========================

-- 1. Seleção com condições: WHERE com AND, OR, NOT
SELECT *
FROM user_classifications
WHERE is_active = TRUE
AND (color_name = 'Azul' OR color_name = 'Verde')
AND NOT class_name = 'Alerta';


-- 2. INNER JOIN
SELECT 
    users.email,
    user_classifications.class_name,
    user_classifications.color_name,
    user_classifications.color_hex
FROM users
INNER JOIN user_classifications
ON users.id = user_classifications.user_id;


-- 3. LEFT OUTER JOIN
SELECT 
    users.email,
    user_preferences.theme,
    user_preferences.notifications_enabled
FROM users
LEFT OUTER JOIN user_preferences
ON users.id = user_preferences.user_id;


-- 4. RIGHT OUTER JOIN
SELECT 
    users.email,
    access_logs.login_time,
    access_logs.ip_address
FROM users
RIGHT OUTER JOIN access_logs
ON users.id = access_logs.user_id;


-- 5. FULL OUTER JOIN simulado no MySQL
SELECT 
    users.email,
    user_preferences.theme
FROM users
LEFT JOIN user_preferences
ON users.id = user_preferences.user_id

UNION

SELECT 
    users.email,
    user_preferences.theme
FROM users
RIGHT JOIN user_preferences
ON users.id = user_preferences.user_id;


-- 6. Junção com GROUP BY
SELECT 
    users.email,
    COUNT(user_classifications.id) AS total_classificacoes
FROM users
LEFT JOIN user_classifications
ON users.id = user_classifications.user_id
GROUP BY users.id, users.email;


-- 7. GROUP BY com HAVING
SELECT 
    users.email,
    COUNT(access_logs.id) AS total_acessos
FROM users
LEFT JOIN access_logs
ON users.id = access_logs.user_id
GROUP BY users.id, users.email
HAVING COUNT(access_logs.id) >= 2;


-- 8. ORDER BY crescente
SELECT *
FROM users
ORDER BY email ASC;


-- 9. ORDER BY decrescente
SELECT *
FROM access_logs
ORDER BY login_time DESC;


-- 10. Funções numéricas: COUNT, MIN, MAX
SELECT 
    COUNT(*) AS total_usuarios,
    MIN(created_at) AS primeiro_usuario,
    MAX(created_at) AS ultimo_usuario
FROM users;


-- 11. AVG e SUM com exemplo usando ids
SELECT 
    AVG(id) AS media_ids_usuarios,
    SUM(id) AS soma_ids_usuarios
FROM users;


-- 12. Funções literais: UPPER, LOWER, LENGTH, CONCAT
SELECT 
    UPPER(email) AS email_maiusculo,
    LOWER(email) AS email_minusculo,
    LENGTH(email) AS tamanho_email,
    CONCAT('Usuário: ', email) AS descricao_usuario
FROM users;


-- 13. Funções de data
SELECT 
    email,
    created_at,
    DATE(created_at) AS data_criacao,
    YEAR(created_at) AS ano,
    MONTH(created_at) AS mes,
    DAY(created_at) AS dia
FROM users;


-- 14. Consultar usuários criados depois de uma data
SELECT *
FROM users
WHERE created_at >= '2026-06-02';


-- 15. UNION combinando usuários com tema dark e usuários com token LIFX
SELECT email, 'Usa tema escuro' AS motivo
FROM users
INNER JOIN user_preferences
ON users.id = user_preferences.user_id
WHERE user_preferences.theme = 'dark'

UNION

SELECT email, 'Possui token LIFX' AS motivo
FROM users
WHERE liftx_token IS NOT NULL;