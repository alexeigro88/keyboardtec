#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Orchestration Dashboard - Deployment Script${NC}"
echo "=================================================="
echo ""

# Check if git is configured
if [ -z "$(git config --global user.email)" ]; then
    echo -e "${YELLOW}Нужно настроить Git. Введи свой email:${NC}"
    read -p "Email: " GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"

    echo -e "${YELLOW}Введи своё имя:${NC}"
    read -p "Имя: " GIT_NAME
    git config --global user.name "$GIT_NAME"
fi

# Get GitHub token
echo ""
echo -e "${YELLOW}📝 Введи свой GitHub Personal Access Token${NC}"
echo "   Создай здесь: https://github.com/settings/tokens"
echo "   (нужны права: repo)"
read -sp "GitHub Token: " GITHUB_TOKEN
echo ""

# Get Vercel token
echo -e "${YELLOW}📝 Введи свой Vercel Token${NC}"
echo "   Создай здесь: https://vercel.com/account/tokens"
read -sp "Vercel Token: " VERCEL_TOKEN
echo ""

# Get GitHub username
echo -e "${YELLOW}📝 Введи свой GitHub username:${NC}"
read -p "GitHub username: " GITHUB_USER

# Create GitHub repository
echo ""
echo -e "${BLUE}📦 Создаю GitHub репозиторий...${NC}"

REPO_NAME="orchestration-dashboard"
REPO_RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Product Orchestration Dashboard\",\"private\":false}")

REPO_URL=$(echo $REPO_RESPONSE | grep -o '"clone_url":"[^"]*' | cut -d'"' -f4)

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Ошибка при создании репозитория. Проверь токен.${NC}"
    echo "Response: $REPO_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Репозиторий создан: $REPO_URL${NC}"

# Add remote and push
echo ""
echo -e "${BLUE}📤 Загружаю код на GitHub...${NC}"

git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git branch -M main
git push -u origin main 2>&1 | grep -v "warning:"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Код загружен на GitHub${NC}"
else
    echo -e "${RED}❌ Ошибка при загрузке на GitHub${NC}"
    exit 1
fi

# Deploy to Vercel
echo ""
echo -e "${BLUE}🚀 Деплою на Vercel...${NC}"

VERCEL_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  https://api.vercel.com/v9/projects \
  -d "{\"name\":\"$REPO_NAME\",\"gitRepository\":{\"type\":\"github\",\"repo\":\"$GITHUB_USER/$REPO_NAME\"}}")

PROJECT_ID=$(echo $VERCEL_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⏳ Попытаюсь найти существующий проект...${NC}"
    PROJECTS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v9/projects)
    PROJECT_ID=$(echo $PROJECTS | grep -o "\"$REPO_NAME\"" | head -1)
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  Проект ещё создаётся на Vercel...${NC}"
    echo ""
    echo -e "${BLUE}📋 Инструкции:${NC}"
    echo "1. Зайди на https://vercel.com/dashboard"
    echo "2. Нажми 'New Project'"
    echo "3. Выбери 'Import Git Repository'"
    echo "4. Найди репозиторий '$GITHUB_USER/$REPO_NAME'"
    echo "5. Нажми 'Deploy'"
    echo ""
    echo -e "${GREEN}После деплоя скопируй ссылку из браузера!${NC}"
else
    echo -e "${GREEN}✅ Проект создан на Vercel${NC}"

    # Trigger deployment
    DEPLOYMENT=$(curl -s -X POST \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      https://api.vercel.com/v12/deployments \
      -d "{\"name\":\"$REPO_NAME\",\"project\":\"$PROJECT_ID\",\"gitSource\":{\"type\":\"github\",\"repo\":\"$GITHUB_USER/$REPO_NAME\",\"ref\":\"main\"}}")

    DEPLOYMENT_URL=$(echo $DEPLOYMENT | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)

    if [ -n "$DEPLOYMENT_URL" ]; then
        echo ""
        echo -e "${GREEN}✅ Деплой успешен!${NC}"
        echo ""
        echo -e "${BLUE}🌐 Твоё приложение доступно здесь:${NC}"
        echo -e "${GREEN}https://$DEPLOYMENT_URL${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📊 GitHub репозиторий:${NC}"
echo -e "${GREEN}$REPO_URL${NC}"
echo ""
