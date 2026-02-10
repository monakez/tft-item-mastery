# Используем проверенный образ для Capacitor 
FROM capgo/capacitor:latest

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование исходников и сборка JS
COPY . .
RUN npm run build

# Синхронизация с Android-проектом
RUN npx cap sync android

# Сборка APK (Gradle уже настроен в образе)
WORKDIR /app/android
RUN ./gradlew assembleDebug

