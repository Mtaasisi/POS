#!/usr/bin/env python3
"""
WhatsApp CRM Dashboard
Interactive dashboard for customer management and analytics
"""

import sqlite3
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import streamlit as st
from datetime import datetime, timedelta
import json

class CRMDashboard:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
    
    def get_customer_overview(self):
        """Get customer overview statistics"""
        cursor = self.conn.cursor()
        
        # Total customers
        cursor.execute("SELECT COUNT(*) FROM customers")
        total_customers = cursor.fetchone()[0]
        
        # Customers by segment
        cursor.execute("""
            SELECT segment, COUNT(*) as count 
            FROM customers 
            GROUP BY segment 
            ORDER BY count DESC
        """)
        segment_data = cursor.fetchall()
        
        # Customers by location
        cursor.execute("""
            SELECT location, COUNT(*) as count 
            FROM customers 
            WHERE location != 'Unknown'
            GROUP BY location 
            ORDER BY count DESC 
            LIMIT 10
        """)
        location_data = cursor.fetchall()
        
        # Recent activity
        cursor.execute("""
            SELECT COUNT(*) FROM customers 
            WHERE last_contact_date >= date('now', '-7 days')
        """)
        recent_activity = cursor.fetchone()[0]
        
        return {
            'total_customers': total_customers,
            'segment_data': segment_data,
            'location_data': location_data,
            'recent_activity': recent_activity
        }
    
    def get_message_analytics(self):
        """Get message analytics"""
        cursor = self.conn.cursor()
        
        # Messages by type
        cursor.execute("""
            SELECT message_type, COUNT(*) as count 
            FROM messages 
            GROUP BY message_type 
            ORDER BY count DESC
        """)
        message_types = cursor.fetchall()
        
        # Daily message volume
        cursor.execute("""
            SELECT DATE(message_date) as date, COUNT(*) as count 
            FROM messages 
            WHERE message_date >= date('now', '-30 days')
            GROUP BY DATE(message_date) 
            ORDER BY date
        """)
        daily_volume = cursor.fetchall()
        
        # Top customers by message volume
        cursor.execute("""
            SELECT c.name, c.phone_number, c.total_messages, c.segment
            FROM customers c 
            ORDER BY c.total_messages DESC 
            LIMIT 10
        """)
        top_customers = cursor.fetchall()
        
        return {
            'message_types': message_types,
            'daily_volume': daily_volume,
            'top_customers': top_customers
        }
    
    def create_customer_segment_chart(self, segment_data):
        """Create customer segment pie chart"""
        labels = [row[0] for row in segment_data]
        values = [row[1] for row in segment_data]
        
        fig = go.Figure(data=[go.Pie(labels=labels, values=values)])
        fig.update_layout(
            title="Customer Segments",
            showlegend=True
        )
        return fig
    
    def create_location_chart(self, location_data):
        """Create location bar chart"""
        locations = [row[0] for row in location_data]
        counts = [row[1] for row in location_data]
        
        fig = go.Figure(data=[go.Bar(x=locations, y=counts)])
        fig.update_layout(
            title="Customers by Location",
            xaxis_title="Location",
            yaxis_title="Number of Customers"
        )
        return fig
    
    def create_message_volume_chart(self, daily_volume):
        """Create daily message volume chart"""
        dates = [row[0] for row in daily_volume]
        counts = [row[1] for row in daily_volume]
        
        fig = go.Figure(data=[go.Scatter(x=dates, y=counts, mode='lines+markers')])
        fig.update_layout(
            title="Daily Message Volume (Last 30 Days)",
            xaxis_title="Date",
            yaxis_title="Number of Messages"
        )
        return fig
    
    def get_customer_details(self, customer_id=None, phone_number=None):
        """Get detailed customer information"""
        cursor = self.conn.cursor()
        
        if customer_id:
            cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
        elif phone_number:
            cursor.execute("SELECT * FROM customers WHERE phone_number = ?", (phone_number,))
        else:
            return None
        
        customer = cursor.fetchone()
        if not customer:
            return None
        
        # Get customer messages
        cursor.execute("""
            SELECT message_date, message_type, message_text, chat_session
            FROM messages 
            WHERE phone_number = ? 
            ORDER BY message_date DESC 
            LIMIT 20
        """, (customer[1],))  # phone_number is at index 1
        
        messages = cursor.fetchall()
        
        return {
            'customer': customer,
            'messages': messages
        }
    
    def search_customers(self, search_term):
        """Search customers by name, phone, or business"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT * FROM customers 
            WHERE name LIKE ? OR phone_number LIKE ? OR business_name LIKE ?
            ORDER BY total_messages DESC
            LIMIT 50
        """, (f'%{search_term}%', f'%{search_term}%', f'%{search_term}%'))
        
        return cursor.fetchall()
    
    def get_arusha_customers(self):
        """Get all Arusha customers"""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT * FROM customers 
            WHERE location = 'Arusha' OR name LIKE '%arusha%' OR business_name LIKE '%arusha%'
            ORDER BY total_messages DESC
        """)
        
        return cursor.fetchall()
    
    def generate_insights(self):
        """Generate business insights"""
        cursor = self.conn.cursor()
        
        # Growth rate
        cursor.execute("""
            SELECT COUNT(*) FROM customers 
            WHERE first_contact_date >= date('now', '-30 days')
        """)
        new_customers_30d = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM customers 
            WHERE first_contact_date >= date('now', '-60 days') 
            AND first_contact_date < date('now', '-30 days')
        """)
        new_customers_60d = cursor.fetchone()[0]
        
        growth_rate = ((new_customers_30d - new_customers_60d) / max(new_customers_60d, 1)) * 100
        
        # Most active customers
        cursor.execute("""
            SELECT name, total_messages, segment 
            FROM customers 
            ORDER BY total_messages DESC 
            LIMIT 5
        """)
        top_active = cursor.fetchall()
        
        # Response time analysis (if we had response time data)
        cursor.execute("""
            SELECT AVG(total_messages) as avg_messages 
            FROM customers 
            WHERE segment = 'vip'
        """)
        vip_avg = cursor.fetchone()[0]
        
        return {
            'growth_rate': growth_rate,
            'new_customers_30d': new_customers_30d,
            'top_active_customers': top_active,
            'vip_avg_messages': vip_avg
        }
    
    def close(self):
        """Close database connection"""
        self.conn.close()

# Streamlit Dashboard
def create_streamlit_dashboard():
    """Create Streamlit dashboard"""
    st.set_page_config(page_title="WhatsApp CRM Dashboard", layout="wide")
    
    # Initialize dashboard
    dashboard = CRMDashboard('/Users/mtaasisi/Desktop/LATS CHANCE copy/crm_system/database/crm.db')
    
    st.title("🏢 WhatsApp CRM Dashboard")
    
    # Sidebar
    st.sidebar.title("Navigation")
    page = st.sidebar.selectbox("Choose a page", [
        "Overview", "Customer Analytics", "Message Analytics", 
        "Customer Search", "Arusha Customers", "Insights"
    ])
    
    if page == "Overview":
        st.header("📊 Customer Overview")
        
        overview = dashboard.get_customer_overview()
        
        # Key metrics
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Customers", overview['total_customers'])
        with col2:
            st.metric("Recent Activity (7d)", overview['recent_activity'])
        with col3:
            st.metric("VIP Customers", len([s for s in overview['segment_data'] if s[0] == 'vip']))
        with col4:
            st.metric("Business Customers", len([s for s in overview['segment_data'] if s[0] == 'business']))
        
        # Charts
        col1, col2 = st.columns(2)
        with col1:
            fig_segment = dashboard.create_customer_segment_chart(overview['segment_data'])
            st.plotly_chart(fig_segment, use_container_width=True)
        
        with col2:
            fig_location = dashboard.create_location_chart(overview['location_data'])
            st.plotly_chart(fig_location, use_container_width=True)
    
    elif page == "Customer Analytics":
        st.header("👥 Customer Analytics")
        
        # Customer segments
        overview = dashboard.get_customer_overview()
        
        st.subheader("Customer Segments")
        segment_df = pd.DataFrame(overview['segment_data'], columns=['Segment', 'Count'])
        st.dataframe(segment_df, use_container_width=True)
        
        # Location analysis
        st.subheader("Geographic Distribution")
        location_df = pd.DataFrame(overview['location_data'], columns=['Location', 'Count'])
        st.dataframe(location_df, use_container_width=True)
    
    elif page == "Message Analytics":
        st.header("💬 Message Analytics")
        
        analytics = dashboard.get_message_analytics()
        
        # Message types
        st.subheader("Message Types")
        message_types_df = pd.DataFrame(analytics['message_types'], columns=['Type', 'Count'])
        st.dataframe(message_types_df, use_container_width=True)
        
        # Daily volume chart
        if analytics['daily_volume']:
            fig_volume = dashboard.create_message_volume_chart(analytics['daily_volume'])
            st.plotly_chart(fig_volume, use_container_width=True)
        
        # Top customers
        st.subheader("Top Customers by Message Volume")
        top_customers_df = pd.DataFrame(analytics['top_customers'], 
                                      columns=['Name', 'Phone', 'Messages', 'Segment'])
        st.dataframe(top_customers_df, use_container_width=True)
    
    elif page == "Customer Search":
        st.header("🔍 Customer Search")
        
        search_term = st.text_input("Search customers (name, phone, business):")
        if search_term:
            results = dashboard.search_customers(search_term)
            if results:
                results_df = pd.DataFrame(results, columns=[
                    'ID', 'Phone', 'Name', 'Business', 'Location', 'Type', 
                    'Segment', 'Messages', 'Last Contact', 'First Contact', 
                    'Products', 'Notes', 'Created', 'Updated'
                ])
                st.dataframe(results_df, use_container_width=True)
            else:
                st.info("No customers found matching your search.")
    
    elif page == "Arusha Customers":
        st.header("🏔️ Arusha Customers")
        
        arusha_customers = dashboard.get_arusha_customers()
        if arusha_customers:
            arusha_df = pd.DataFrame(arusha_customers, columns=[
                'ID', 'Phone', 'Name', 'Business', 'Location', 'Type', 
                'Segment', 'Messages', 'Last Contact', 'First Contact', 
                'Products', 'Notes', 'Created', 'Updated'
            ])
            
            st.metric("Total Arusha Customers", len(arusha_customers))
            st.dataframe(arusha_df, use_container_width=True)
        else:
            st.info("No Arusha customers found.")
    
    elif page == "Insights":
        st.header("💡 Business Insights")
        
        insights = dashboard.generate_insights()
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Growth Rate (30d)", f"{insights['growth_rate']:.1f}%")
            st.metric("New Customers (30d)", insights['new_customers_30d'])
        
        with col2:
            st.metric("VIP Avg Messages", f"{insights['vip_avg_messages']:.0f}")
        
        st.subheader("Top Active Customers")
        top_active_df = pd.DataFrame(insights['top_active_customers'], 
                                   columns=['Name', 'Messages', 'Segment'])
        st.dataframe(top_active_df, use_container_width=True)
    
    dashboard.close()

if __name__ == "__main__":
    create_streamlit_dashboard()
