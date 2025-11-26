# 🚀 Деплой в Kubernetes

## Предварительные требования

1. **Kubernetes кластер** (minikube, kind, GKE, EKS, AKS, или любой другой)
2. **kubectl** настроен и подключен к кластеру
3. **Docker** для сборки образа
4. **Доступ к container registry** (Docker Hub, GCR, ECR, ACR, или приватный registry)

## Шаг 1: Сборка и публикация Docker образа

### Локальная сборка и публикация в Docker Hub

```bash
# Сборка образа
docker build -t your-username/cashback-bot:latest .

# Тегирование для registry
docker tag your-username/cashback-bot:latest your-username/cashback-bot:v1.0.0

# Вход в Docker Hub (или другой registry)
docker login

# Публикация образа
docker push your-username/cashback-bot:latest
docker push your-username/cashback-bot:v1.0.0
```

### Использование GitHub Container Registry

```bash
# Сборка
docker build -t ghcr.io/your-username/cashback-bot:latest .

# Вход в GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin

# Публикация
docker push ghcr.io/your-username/cashback-bot:latest
```

## Шаг 2: Настройка секретов

### Обновление секретов PostgreSQL

```bash
# Редактируйте k8s/postgres-secret.yaml
# Установите безопасный пароль для POSTGRES_PASSWORD
```

Или создайте секрет через kubectl:

```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_DB=cashback_bot \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=your-secure-password \
  --namespace=cashback-bot
```

### Обновление секретов бота

```bash
# Редактируйте k8s/bot-secret.yaml
# Заполните все необходимые значения:
# - BOT_TOKEN
# - DEEPSEEK_API_KEY
# - YANDEX_GPT_API_KEY (опционально)
# - YANDEX_GPT_FOLDER_ID (опционально)
# - SENTRY_DSN (опционально)
```

Или создайте через kubectl:

```bash
kubectl create secret generic bot-secret \
  --from-literal=BOT_TOKEN=your-bot-token \
  --from-literal=DEEPSEEK_API_KEY=your-api-key \
  --namespace=cashback-bot
```

## Шаг 3: Обновление образа в манифестах

Отредактируйте `k8s/bot-deployment.yaml` и `k8s/job-migrations.yaml`:

```yaml
image: your-username/cashback-bot:latest  # Замените на ваш образ
```

Или используйте переменные окружения:

```bash
export IMAGE_REGISTRY=your-username
export IMAGE_NAME=cashback-bot
export IMAGE_TAG=latest

# Замените в файлах
sed -i "s|cashback-bot:latest|${IMAGE_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/bot-deployment.yaml
sed -i "s|cashback-bot:latest|${IMAGE_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}|g" k8s/job-migrations.yaml
```

## Шаг 4: Настройка Storage Class

Проверьте доступные storage classes в вашем кластере:

```bash
kubectl get storageclass
```

Обновите `k8s/postgres-pvc.yaml` с правильным `storageClassName`:

```yaml
storageClassName: standard  # Замените на ваш storage class
```

## Шаг 5: Деплой в Kubernetes

### Вариант 1: Использование kubectl

```bash
# Создание namespace
kubectl apply -f k8s/namespace.yaml

# Применение всех ресурсов
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml

# Ожидание готовности PostgreSQL
kubectl wait --for=condition=ready pod -l app=postgres -n cashback-bot --timeout=300s

# Запуск миграций (только при первом деплое)
kubectl apply -f k8s/job-migrations.yaml
kubectl wait --for=condition=complete job/run-migrations -n cashback-bot --timeout=300s

# Деплой бота
kubectl apply -f k8s/bot-secret.yaml
kubectl apply -f k8s/bot-configmap.yaml
kubectl apply -f k8s/bot-deployment.yaml
kubectl apply -f k8s/bot-service.yaml
```

### Вариант 2: Использование Kustomize

```bash
# Применение всех ресурсов через kustomize
kubectl apply -k k8s/

# Или с указанием образа
kubectl apply -k k8s/ --set image=your-username/cashback-bot:latest
```

### Вариант 3: Использование Helm (опционально)

Создайте Helm chart для более гибкого управления:

```bash
helm create cashback-bot
# Настройте values.yaml и templates/
helm install cashback-bot ./cashback-bot
```

## Шаг 6: Проверка деплоя

### Проверка статуса подов

```bash
# Все поды в namespace
kubectl get pods -n cashback-bot

# Детальная информация
kubectl describe pod -l app=cashback-bot -n cashback-bot
```

### Просмотр логов

```bash
# Логи бота
kubectl logs -f deployment/cashback-bot -n cashback-bot

# Логи PostgreSQL
kubectl logs -f deployment/postgres -n cashback-bot

# Логи миграций
kubectl logs job/run-migrations -n cashback-bot
```

### Проверка сервисов

```bash
kubectl get svc -n cashback-bot
```

### Проверка событий

```bash
kubectl get events -n cashback-bot --sort-by='.lastTimestamp'
```

## Обновление приложения

### Обновление образа

```bash
# 1. Соберите и опубликуйте новый образ
docker build -t your-username/cashback-bot:v1.1.0 .
docker push your-username/cashback-bot:v1.1.0

# 2. Обновите deployment
kubectl set image deployment/cashback-bot \
  bot=your-username/cashback-bot:v1.1.0 \
  -n cashback-bot

# 3. Проверьте статус обновления
kubectl rollout status deployment/cashback-bot -n cashback-bot

# 4. Откат при необходимости
kubectl rollout undo deployment/cashback-bot -n cashback-bot
```

### Обновление конфигурации

```bash
# Обновление ConfigMap
kubectl apply -f k8s/bot-configmap.yaml
kubectl rollout restart deployment/cashback-bot -n cashback-bot

# Обновление секретов
kubectl apply -f k8s/bot-secret.yaml
kubectl rollout restart deployment/cashback-bot -n cashback-bot
```

## Масштабирование

### Горизонтальное масштабирование бота

```bash
# Увеличить количество реплик
kubectl scale deployment/cashback-bot --replicas=3 -n cashback-bot

# Или через редактирование
kubectl edit deployment/cashback-bot -n cashback-bot
# Измените replicas: 1 на нужное значение
```

### Автомасштабирование (HPA)

Создайте файл `k8s/hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cashback-bot-hpa
  namespace: cashback-bot
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cashback-bot
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Примените:

```bash
kubectl apply -f k8s/hpa.yaml
```

## Резервное копирование базы данных

### Создание бэкапа

```bash
# Создание Job для бэкапа
kubectl run postgres-backup --rm -it --restart=Never \
  --image=postgres:15-alpine \
  --namespace=cashback-bot \
  --env="PGPASSWORD=$(kubectl get secret postgres-secret -n cashback-bot -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)" \
  -- sh -c "pg_dump -h postgres -U postgres cashback_bot > /tmp/backup.sql && cat /tmp/backup.sql" > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление из бэкапа

```bash
kubectl run postgres-restore --rm -it --restart=Never \
  --image=postgres:15-alpine \
  --namespace=cashback-bot \
  --env="PGPASSWORD=$(kubectl get secret postgres-secret -n cashback-bot -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)" \
  -- sh -c "cat /tmp/backup.sql | psql -h postgres -U postgres cashback_bot" < backup_20231126_120000.sql
```

## Мониторинг

### Установка Prometheus и Grafana (опционально)

```bash
# Добавление Helm репозитория
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Установка Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### Метрики приложения

Бот уже экспортирует метрики Prometheus на порту 9090 (если настроено). Добавьте ServiceMonitor:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: cashback-bot-metrics
  namespace: cashback-bot
spec:
  selector:
    matchLabels:
      app: cashback-bot
  endpoints:
  - port: http
    path: /metrics
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверка сервиса PostgreSQL
kubectl get svc postgres -n cashback-bot

# Проверка DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup postgres.cashback-bot.svc.cluster.local

# Проверка подключения из пода бота
kubectl exec -it deployment/cashback-bot -n cashback-bot -- sh
# Внутри пода:
# psql postgresql://postgres:password@postgres:5432/cashback_bot
```

### Проблемы с образами

```bash
# Проверка доступности образа
kubectl describe pod -l app=cashback-bot -n cashback-bot | grep -A 5 Events

# Проверка ImagePullSecrets (если нужен приватный registry)
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  -n cashback-bot
```

### Проблемы с ресурсами

```bash
# Проверка использования ресурсов
kubectl top pods -n cashback-bot

# Проверка лимитов
kubectl describe pod -l app=cashback-bot -n cashback-bot | grep -A 10 "Limits"
```

### Проблемы с миграциями

```bash
# Просмотр логов миграций
kubectl logs job/run-migrations -n cashback-bot

# Перезапуск миграций
kubectl delete job run-migrations -n cashback-bot
kubectl apply -f k8s/job-migrations.yaml
```

## Удаление

```bash
# Удаление всех ресурсов
kubectl delete namespace cashback-bot

# Или через kustomize
kubectl delete -k k8s/

# Удаление с сохранением данных (PVC)
kubectl delete deployment,service,configmap,secret -n cashback-bot --all
# PVC останется для восстановления данных
```

## Полезные команды

```bash
# Порт-форвардинг для локального доступа
kubectl port-forward svc/cashback-bot 9090:9090 -n cashback-bot

# Вход в под бота
kubectl exec -it deployment/cashback-bot -n cashback-bot -- sh

# Вход в под PostgreSQL
kubectl exec -it deployment/postgres -n cashback-bot -- psql -U postgres cashback_bot

# Просмотр всех ресурсов
kubectl get all -n cashback-bot

# Описание ресурса
kubectl describe deployment/cashback-bot -n cashback-bot
```

## Безопасность

### Рекомендации:

1. **Используйте Kubernetes Secrets** для всех чувствительных данных
2. **Включите Network Policies** для ограничения трафика
3. **Используйте RBAC** для контроля доступа
4. **Регулярно обновляйте образы** и зависимости
5. **Используйте Pod Security Policies** или Pod Security Standards
6. **Включите audit logging** в кластере
7. **Используйте TLS** для всех внешних соединений

### Пример NetworkPolicy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cashback-bot-netpol
  namespace: cashback-bot
spec:
  podSelector:
    matchLabels:
      app: cashback-bot
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 9090
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

Примените:

```bash
kubectl apply -f k8s/network-policy.yaml
```

