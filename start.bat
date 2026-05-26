@echo off
title P&G Wrestling Server
color 0A
echo =========================================
echo   STARTING P&G WRESTLING SERVER...
echo   DO NOT CLOSE THIS WINDOW.
echo =========================================
cd /d E:\WrestlingSim
start http://localhost:8001
python -m http.server 8001
pause