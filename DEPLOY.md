# 🚀 Инструкция по деплою на хостинг

> **Примечание**: Для production рекомендуется использовать Kubernetes. Инструкция по деплою в Kubernetes: [K8S_DEPLOY.md](K8S_DEPLOY.md)
>
> Эта инструкция описывает деплой через Docker Compose для простых случаев или когда Kubernetes недоступен.

## Подготовка к деплою

### 1. Настройка переменных окружения

Создайте файл `.env.production` с необходимыми переменными:

```bash
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token

# Database
POSTGRES_DB=cashback_bot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# LLM API Keys
DEEPSEEK_API_KEY=your_deepseek_api_key
YANDEX_GPT_API_KEY=your_yandex_gpt_api_key
YANDEX_GPT_FOLDER_ID=your_folder_id

# Optional
NODE_ENV=production
DATABASE_LOGGING=false
SENTRY_DSN=your_sentry_dsn_if_using
BOT_PORT=9090
```

### 2. Настройка Docker на сервере

#### Установка Docker и Docker Compose

**Ubuntu/Debian:**
```bash
# Обновление пакетов
sudo apt update

# Установка зависимостей
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление официального GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Проверка установки
docker --version
docker compose version
```

**CentOS/RHEL:**
```bash
# Установка зависимостей
sudo yum install -y yum-utils

# Добавление репозитория Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Установка Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker

# Проверка установки
docker --version
docker compose version
```

## Деплой на сервер

### Вариант 1: Деплой через Git (рекомендуется)

1. **Клонирование репозитория на сервер:**
```bash
cd /opt
sudo git clone https://github.com/your-username/cashback-help.git
cd cashback-help
```

2. **Создание файла окружения:**
```bash
sudo cp .env.example .env.production
sudo nano .env.production  # Заполните все переменные
```

3. **Сборка и запуск:**
```bash
# Сборка образов
sudo docker compose -f docker-compose.prod.yml build

# Запуск в фоновом режиме
sudo docker compose -f docker-compose.prod.yml up -d

# Просмотр логов
sudo docker compose -f docker-compose.prod.yml logs -f bot
```

### Вариант 2: Деплой через Docker Hub

1. **Сборка и публикация образа:**
```bash
# Локально или в CI/CD
docker build -t your-username/cashback-bot:latest .
docker push your-username/cashback-bot:latest
```

2. **На сервере:**
```bash
# Создайте docker-compose.prod.yml с использованием образа из Docker Hub
# Замените build: на image: your-username/cashback-bot:latest

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Управление контейнерами

### Просмотр статуса
```bash
sudo docker compose -f docker-compose.prod.yml ps
```

### Просмотр логов
```bash
# Все сервисы
sudo docker compose -f docker-compose.prod.yml logs -f

# Только бот
sudo docker compose -f docker-compose.prod.yml logs -f bot

# Только база данных
sudo docker compose -f docker-compose.prod.yml logs -f postgres
```

### Остановка и запуск
```bash
# Остановка
sudo docker compose -f docker-compose.prod.yml stop

# Запуск
sudo docker compose -f docker-compose.prod.yml start

# Перезапуск
sudo docker compose -f docker-compose.prod.yml restart bot

# Полная остановка и удаление контейнеров
sudo docker compose -f docker-compose.prod.yml down
```

### Обновление приложения
```bash
# Получение последних изменений
cd /opt/cashback-help
sudo git pull

# Пересборка и перезапуск
sudo docker compose -f docker-compose.prod.yml up -d --build

# Или если используете Docker Hub
sudo docker compose -f docker-compose.prod.yml pull
sudo docker compose -f docker-compose.prod.yml up -d
```

## Резервное копирование базы данных

### Создание бэкапа
```bash
# Создание бэкапа
sudo docker exec cashback-bot-db-prod pg_dump -U postgres cashback_bot > backup_$(date +%Y%m%d_%H%M%S).sql

# Или с паролем
sudo docker exec cashback-bot-db-prod PGPASSWORD=your_password pg_dump -U postgres cashback_bot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление из бэкапа
```bash
# Восстановление
sudo docker exec -i cashback-bot-db-prod psql -U postgres cashback_bot < backup_20231126_120000.sql
```

## Мониторинг и обслуживание

### Проверка здоровья контейнеров
```bash
# Статус контейнеров
sudo docker compose -f docker-compose.prod.yml ps

# Использование ресурсов
sudo docker stats

# Проверка логов на ошибки
sudo docker compose -f docker-compose.prod.yml logs bot | grep -i error
```

### Очистка неиспользуемых ресурсов
```bash
# Удаление неиспользуемых образов
sudo docker image prune -a

# Удаление неиспользуемых томов
sudo docker volume prune

# Полная очистка (осторожно!)
sudo docker system prune -a --volumes
```

## Настройка автозапуска при перезагрузке сервера

Docker Compose уже настроен с `restart: always`, но для дополнительной надежности:

```bash
# Создание systemd сервиса
sudo nano /etc/systemd/system/cashback-bot.service
```

Содержимое файла:
```ini
[Unit]
Description=Cashback Help Bot
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/cashback-help
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активация сервиса:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cashback-bot.service
sudo systemctl start cashback-bot.service
```

## Безопасность

### Рекомендации:

1. **Используйте сильные пароли** для базы данных
2. **Не экспортируйте порт PostgreSQL** в production (уберите из docker-compose.prod.yml)
3. **Используйте firewall** для ограничения доступа:
```bash
# Ubuntu/Debian
sudo ufw allow 9090/tcp
sudo ufw enable
```
4. **Регулярно обновляйте** Docker образы и зависимости
5. **Используйте secrets** для хранения чувствительных данных (Docker Secrets или внешние системы)

## Troubleshooting

### Бот не запускается
```bash
# Проверьте логи
sudo docker compose -f docker-compose.prod.yml logs bot

# Проверьте переменные окружения
sudo docker compose -f docker-compose.prod.yml config

# Проверьте подключение к БД
sudo docker exec cashback-bot-prod node -e "console.log(process.env.DATABASE_URL)"
```

### Проблемы с миграциями
```bash
# Ручной запуск миграций
sudo docker exec cashback-bot-prod sh -c "cd /app && node dist/database/migrations/run-migrations.js"
```

### Проблемы с памятью
```bash
# Ограничение памяти для контейнеров в docker-compose.prod.yml
services:
  bot:
    deploy:
      resources:
        limits:
          memory: 512M
```

## Полезные команды

```bash
# Вход в контейнер бота
sudo docker exec -it cashback-bot-prod sh

# Вход в контейнер БД
sudo docker exec -it cashback-bot-db-prod psql -U postgres cashback_bot

# Просмотр переменных окружения
sudo docker exec cashback-bot-prod env

# Перезапуск только бота
sudo docker compose -f docker-compose.prod.yml restart bot
```

## Поддержка

При возникновении проблем проверьте:
1. Логи: `docker compose -f docker-compose.prod.yml logs -f`
2. Статус контейнеров: `docker compose -f docker-compose.prod.yml ps`
3. Использование ресурсов: `docker stats`
4. Сеть: `docker network ls` и `docker network inspect`
