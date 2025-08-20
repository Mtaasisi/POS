#!/bin/bash

# WiFi Scanner Script
# This script helps find available WiFi networks

echo "📶 WiFi Network Scanner"
echo "======================"
echo ""

# Function to detect OS and use appropriate commands
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "Windows"
    else
        echo "Unknown"
    fi
}

# Function to scan WiFi on macOS
scan_macos() {
    echo "🔍 Scanning for WiFi networks on macOS..."
    echo ""
    
    # Get current WiFi interface
    WIFI_INTERFACE=$(networksetup -listallhardwareports | grep -A 1 "Wi-Fi" | grep "Device" | awk '{print $2}')
    
    if [ -z "$WIFI_INTERFACE" ]; then
        echo "❌ No WiFi interface found"
        return 1
    fi
    
    echo "📡 WiFi Interface: $WIFI_INTERFACE"
    echo ""
    
    # Get current WiFi connection
    echo "🔗 Current Connection:"
    CURRENT_SSID=$(networksetup -getairportnetwork "$WIFI_INTERFACE" | awk -F': ' '{print $2}')
    if [ -n "$CURRENT_SSID" ]; then
        echo "   SSID: $CURRENT_SSID"
        echo "   Status: Connected"
    else
        echo "   Status: Not connected"
    fi
    echo ""
    
    # Scan for available networks
    echo "📋 Available Networks:"
    echo "======================"
    
    # Use airport command to scan (requires sudo on some systems)
    if command -v airport &> /dev/null; then
        echo "Scanning with airport command..."
        sudo airport -s 2>/dev/null | while read -r line; do
            if [[ $line =~ ^[A-Za-z0-9_-] ]]; then
                SSID=$(echo "$line" | awk '{print $1}')
                RSSI=$(echo "$line" | awk '{print $2}')
                CHANNEL=$(echo "$line" | awk '{print $3}')
                SECURITY=$(echo "$line" | awk '{print $4}')
                
                # Format output
                printf "%-20s | %-8s | %-8s | %-10s\n" "$SSID" "$RSSI" "$CHANNEL" "$SECURITY"
            fi
        done
    else
        echo "❌ airport command not available"
        echo "Try: sudo ln -s /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport /usr/local/bin/airport"
    fi
}

# Function to scan WiFi on Linux
scan_linux() {
    echo "🔍 Scanning for WiFi networks on Linux..."
    echo ""
    
    # Check if iwlist is available
    if command -v iwlist &> /dev/null; then
        echo "📋 Available Networks:"
        echo "======================"
        
        # Get WiFi interface
        WIFI_INTERFACE=$(iw dev | grep Interface | awk '{print $2}' | head -1)
        
        if [ -z "$WIFI_INTERFACE" ]; then
            echo "❌ No WiFi interface found"
            return 1
        fi
        
        echo "📡 WiFi Interface: $WIFI_INTERFACE"
        echo ""
        
        # Scan for networks
        sudo iwlist "$WIFI_INTERFACE" scan 2>/dev/null | grep -E "(ESSID|Quality|Encryption)" | while read -r line; do
            if [[ $line =~ ESSID ]]; then
                SSID=$(echo "$line" | sed 's/.*ESSID:"\([^"]*\)".*/\1/')
                printf "%-20s | " "$SSID"
            elif [[ $line =~ Quality ]]; then
                QUALITY=$(echo "$line" | sed 's/.*Quality=\([0-9]*\).*/\1/')
                printf "%-8s | " "$QUALITY"
            elif [[ $line =~ Encryption ]]; then
                ENCRYPTION=$(echo "$line" | sed 's/.*Encryption key:\([^ ]*\).*/\1/')
                printf "%-10s\n" "$ENCRYPTION"
            fi
        done
    else
        echo "❌ iwlist command not available"
        echo "Install wireless-tools: sudo apt-get install wireless-tools"
    fi
}

# Function to scan WiFi on Windows
scan_windows() {
    echo "🔍 Scanning for WiFi networks on Windows..."
    echo ""
    echo "📋 Available Networks:"
    echo "======================"
    
    # Use netsh command
    netsh wlan show networks mode=bssid 2>/dev/null | while read -r line; do
        if [[ $line =~ "SSID" ]] && [[ ! $line =~ "BSSID" ]]; then
            SSID=$(echo "$line" | sed 's/.*SSID[^:]*: \(.*\)/\1/')
            printf "%-20s | " "$SSID"
        elif [[ $line =~ "Signal" ]]; then
            SIGNAL=$(echo "$line" | sed 's/.*Signal[^:]*: \(.*\)/\1/')
            printf "%-8s | " "$SIGNAL"
        elif [[ $line =~ "Authentication" ]]; then
            AUTH=$(echo "$line" | sed 's/.*Authentication[^:]*: \(.*\)/\1/')
            printf "%-10s\n" "$AUTH"
        fi
    done
}

# Main execution
OS=$(detect_os)
echo "🖥️  Operating System: $OS"
echo ""

case $OS in
    "macOS")
        scan_macos
        ;;
    "Linux")
        scan_linux
        ;;
    "Windows")
        scan_windows
        ;;
    *)
        echo "❌ Unsupported operating system: $OS"
        echo ""
        echo "Manual commands you can try:"
        echo "  macOS: sudo airport -s"
        echo "  Linux: sudo iwlist wlan0 scan"
        echo "  Windows: netsh wlan show networks"
        ;;
esac

echo ""
echo "💡 Tips:"
echo "  - Some commands require sudo/administrator privileges"
echo "  - Signal strength is shown in dBm (lower is better)"
echo "  - Channel numbers help identify network congestion"
echo "  - Security types: Open, WEP, WPA, WPA2, WPA3"
