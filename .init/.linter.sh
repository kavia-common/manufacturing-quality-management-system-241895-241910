#!/bin/bash
cd /home/kavia/workspace/code-generation/manufacturing-quality-management-system-241895-241910/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

