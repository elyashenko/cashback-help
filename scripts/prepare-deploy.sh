#!/bin/bash
set -e

echo "🚀 Подготовка к деплою Cashback-Help Bot"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия необходимых инструментов
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 не установлен${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 установлен${NC}"
        return 0
    fi
}

echo "📦 Проверка необходимых инструментов..."
check_command docker || exit 1
check_command kubectl || echo -e "${YELLOW}⚠️  kubectl не установлен (нужен для Kubernetes)${NC}"

echo ""
echo "🔍 Проверка конфигурации..."

# Проверка секретов
if grep -q 'change-me-please\|""' k8s/postgres-secret.yaml; then
    echo -e "${RED}❌ POSTGRES_PASSWORD не установлен в k8s/postgres-secret.yaml${NC}"
    exit 1
fi

if grep -q '""' k8s/bot-secret.yaml; then
    echo -e "${YELLOW}⚠️  Некоторые секреты в k8s/bot-secret.yaml не заполнены${NC}"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Проверка образа в манифестах
if grep -q 'cashback-bot:latest' k8s/bot-deployment.yaml; then
    echo -e "${YELLOW}⚠️  Образ в k8s/bot-deployment.yaml использует дефолтное значение${NC}"
    echo "   Убедитесь, что вы обновили его на ваш registry/image:tag"
fi

echo ""
echo "📝 Информация о текущей конфигурации:"
echo "   Namespace: cashback-bot"
echo "   PostgreSQL: postgres:15-alpine"
echo "   Node.js: 24-alpine"

echo ""
read -p "Введите имя вашего Docker образа (например: your-registry/cashback-bot:latest): " IMAGE_NAME

if [ -z "$IMAGE_NAME" ]; then
    echo -e "${RED}❌ Имя образа не может быть пустым${NC}"
    exit 1
fi

echo ""
echo "🔨 Сборка Docker образа..."
docker build -t $IMAGE_NAME .

echo ""
read -p "Опубликовать образ в registry? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Публикация образа..."
    docker push $IMAGE_NAME
    
    # Обновление манифестов
    echo ""
    echo "🔄 Обновление манифестов с новым образом..."
    sed -i.bak "s|cashback-bot:latest|$IMAGE_NAME|g" k8s/bot-deployment.yaml
    sed -i.bak "s|cashback-bot:latest|$IMAGE_NAME|g" k8s/job-migrations.yaml
    rm -f k8s/*.bak
    
    echo -e "${GREEN}✅ Манифесты обновлены${NC}"
fi

echo ""
echo -e "${GREEN}✅ Подготовка завершена!${NC}"
echo ""
echo "Следующие шаги:"
echo "1. Проверьте секреты в k8s/postgres-secret.yaml и k8s/bot-secret.yaml"
echo "2. Убедитесь, что kubectl настроен и подключен к кластеру"
echo "3. Запустите: kubectl apply -k k8s/"
echo "4. Проверьте статус: kubectl get pods -n cashback-bot"

