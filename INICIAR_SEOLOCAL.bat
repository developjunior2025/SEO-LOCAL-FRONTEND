@echo off
setlocal EnableDelayedExpansion

:: Ubicar la carpeta del frontend (donde está este .bat)
set "FRONTEND_DIR=%~dp0"
if "%FRONTEND_DIR:~-1%"=="\" set "FRONTEND_DIR=%FRONTEND_DIR:~0,-1%"
set "BACKEND_DIR=%FRONTEND_DIR%\..\..\SEO-LOCAL-BACKEND-main"

pushd "%FRONTEND_DIR%"

echo [SEOLOCAL] ========================================
echo [SEOLOCAL] Arranque completo de SEO Local
echo [SEOLOCAL] Frontend: %FRONTEND_DIR%
echo [SEOLOCAL] Backend:  %BACKEND_DIR%
echo [SEOLOCAL] ========================================

:: Validar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [SEOLOCAL ERROR] Node.js no esta instalado o no esta en PATH.
    pause
    exit /b 1
)
echo [SEOLOCAL] Node.js detectado: 
node --version

:: Validar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [SEOLOCAL ERROR] npm no esta disponible.
    pause
    exit /b 1
)
echo [SEOLOCAL] npm detectado: 
npm --version

:: Validar carpetas
if not exist "%FRONTEND_DIR%\package.json" (
    echo [SEOLOCAL ERROR] No se encontro package.json en el frontend.
    pause
    exit /b 1
)
if not exist "%BACKEND_DIR%\package.json" (
    echo [SEOLOCAL ERROR] No se encontro package.json en el backend: %BACKEND_DIR%
    pause
    exit /b 1
)

:: Validar Docker e intentar iniciar Docker Desktop si no responde
echo [SEOLOCAL] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [SEOLOCAL] Docker no responde. Intentando iniciar Docker Desktop...
    set "DOCKER_DESKTOP=%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    if exist "!DOCKER_DESKTOP!" (
        start "" "!DOCKER_DESKTOP!"
        echo [SEOLOCAL] Esperando a que Docker Desktop arranque...
        :wait_docker
        timeout /t 5 /nobreak >nul
        docker info >nul 2>&1
        if errorlevel 1 (
            set /a "DOCKER_RETRIES+=1"
            if !DOCKER_RETRIES! leq 30 goto wait_docker
            echo [SEOLOCAL ERROR] Docker Desktop no respondio tras 150 segundos.
            pause
            exit /b 1
        )
    ) else (
        echo [SEOLOCAL ERROR] Docker Desktop no esta instalado en !DOCKER_DESKTOP!.
        pause
        exit /b 1
    )
)
echo [SEOLOCAL] Docker disponible.

:: Instalar dependencias del backend si faltan
if not exist "%BACKEND_DIR%\node_modules" (
    echo [SEOLOCAL] Instalando dependencias del backend...
    pushd "%BACKEND_DIR%"
    npm install
    if errorlevel 1 (
        echo [SEOLOCAL ERROR] Fallo npm install en el backend.
        pause
        exit /b 1
    )
    popd
)

:: Instalar dependencias del frontend si faltan
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [SEOLOCAL] Instalando dependencias del frontend...
    npm install
    if errorlevel 1 (
        echo [SEOLOCAL ERROR] Fallo npm install en el frontend.
        pause
        exit /b 1
    )
)

:: Iniciar todo
echo [SEOLOCAL] Iniciando PostgreSQL, backend y frontend...
npm run dev

:: Si termina con error, mantener consola abierta
if errorlevel 1 (
    echo [SEOLOCAL ERROR] npm run dev finalizo con codigo %errorlevel%.
    pause
)

popd
endlocal
