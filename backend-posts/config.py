import os

MYSQL_HOST = os.getenv('MYSQL_HOST', 'mysql')
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'rootpassword')
MYSQL_DB = os.getenv('MYSQL_DATABASE', 'quizdb')
MYSQL_CHARSET = 'utf8mb4'
MYSQL_INIT_COMMAND = 'SET NAMES utf8mb4 COLLATE utf8mb4_polish_ci'

