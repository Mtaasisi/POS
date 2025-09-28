#!/bin/bash

echo "🚀 Installing dependencies..."
npm install

echo "📞 Running call log analysis..."
node analyze-call-log-simple.js

echo "✅ Analysis complete!"
