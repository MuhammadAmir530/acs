@echo off
echo ====================================
echo   ACS Database Backup - %date% %time%
echo ====================================
cd /d "c:\Professional Projects\acs_website"
node src/scripts/backup_database.js
echo ====================================
echo   Backup Complete
echo ====================================
