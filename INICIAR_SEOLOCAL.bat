@echo off
setlocal EnableDelayedExpansion

:: Moverse a la carpeta donde está este .bat
pushd "%~dp0"

:: Instalar dependencias solo si falta node_modules
if not exist "node_modules\" (
    echo [SEOLOCAL] node_modules no encontrado. Ejecutando npm install...
    npm install
    if errorlevel 1 (
        echo [SEOLOCAL] ERROR: npm install falló.
        pause
        exit /b 1
    )
)

:: Iniciar frontend + backend
@echo [SEOLOCAL] Iniciando backend (NestJS) y frontend (Vite)...
npm run dev

:: Si npm run dev termina con error, mantener la consola abierta
if errorlevel 1 (
    echo [SEOLOCAL] ERROR: npm run dev finalizó con código %errorlevel%.
    pause
)

popd
endlocal
