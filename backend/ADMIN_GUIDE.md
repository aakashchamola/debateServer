# Django Admin Panel Guide

## 🚀 **Accessing the Admin Panel**

1. **URL**: `http://127.0.0.1:8003/admin/`
2. **Login Credentials**:
   - **Superuser**: `kakuaakash` / [your password]
   - **Moderator**: `moderator1` / `admin123`
   - **Student 1**: `student1` / `student123`
   - **Student 2**: `student2` / `student123`

## 📊 **Admin Features Overview**

### **Main Dashboard**
- **Custom Header**: "Online Debate Platform Administration"
- **Quick Links**: Access to all models and apps
- **Recent Actions**: See latest changes made by administrators

### **Users Management (`users` app)**
- **List View**: Username, email, role, status, join date
- **Filters**: By role (Student/Moderator), active status, join date
- **Search**: By username or email
- **Role Management**: Assign moderator/student roles
- **User Details**: Full profile information

### **Debates Management (`debates` app)**

#### **Debate Topics**
- **List View**: Title, creator, session count, creation date, status
- **Features**: 
  - Click on session count to see related sessions
  - Search by title, description, or creator
  - Filter by status and creation date
- **Actions**: Create, edit, activate/deactivate topics

#### **Debate Sessions**
- **List View**: Topic, start/end time, creator, participant count, message count, status
- **Status Indicators**: 
  - 🟢 Ongoing (green)
  - 🟠 Upcoming (orange) 
  - 🔴 Ended (red)
- **Features**: 
  - Click counts to see related participants/messages
  - Filter by date and creator role
- **Actions**: Schedule, modify, activate/deactivate sessions

#### **Participants**
- **List View**: User, session info, join date, status
- **Features**: Track user participation across sessions
- **Actions**: Manage participant status

#### **Messages**
- **List View**: Sender, session topic, message preview, timestamp, deleted status
- **Admin Actions**: 
  - Mark messages as deleted (moderation)
  - Restore deleted messages
  - Bulk operations
- **Filters**: By deleted status, timestamp, sender role

### **Moderation Management (`moderation` app)**
- **List View**: Action type, participant, session, timestamp
- **Actions**: MUTE, REMOVE, WARN
- **Features**: 
  - Track all moderation actions
  - Filter by action type and date
  - Search by participant or session

### **Notifications Management (`notifications` app)**
- **List View**: Message preview, user, read status, timestamp
- **Admin Actions**:
  - Mark as read/unread (bulk operations)
  - Create system-wide notifications
- **Features**: Track user engagement with notifications

### **Voting Management (`voting` app)**
- **List View**: Session, user, choice, timestamp
- **Features**: 
  - Analyze voting patterns
  - Track session outcomes
  - Filter by choice and date

## 🔧 **Admin Capabilities**

### **For Superusers**
- ✅ Full access to all models
- ✅ User management and role assignment
- ✅ System configuration
- ✅ Bulk operations
- ✅ Data export/import

### **For Moderators** (if admin access granted)
- ✅ Manage debate topics and sessions
- ✅ View and moderate messages
- ✅ Manage participants
- ✅ Track moderation actions

### **Advanced Features**

#### **Bulk Actions**
- Delete multiple records
- Mark notifications as read/unread
- Moderate messages in bulk

#### **Filtering & Search**
- **Date Hierarchy**: Navigate by creation dates
- **Advanced Filters**: Multi-field filtering
- **Search**: Across multiple fields
- **Related Field Search**: Search in foreign key fields

#### **Data Insights**
- **Click-through Navigation**: Related record counts are clickable
- **Status Indicators**: Visual status representations
- **Timestamps**: Automatic tracking of creation/modification

## 📱 **Mobile Responsive**
The admin panel is mobile-responsive and works well on tablets and phones.

## 🔒 **Security Features**
- **Authentication Required**: All admin access requires login
- **Role-based Access**: Different permission levels
- **Action Logging**: All admin actions are logged
- **CSRF Protection**: Built-in security measures

## 🚀 **Getting Started**

1. **Login** at `http://127.0.0.1:8003/admin/`
2. **Explore** the sample data created
3. **Create** new debate topics
4. **Schedule** debate sessions
5. **Monitor** user activity and messages
6. **Moderate** content as needed

## 💡 **Tips for Effective Admin Use**

- Use **filters** to quickly find specific records
- **Bookmark** frequently used admin pages
- Use **bulk actions** for efficiency
- Check **Recent Actions** to monitor changes
- Use **search** for quick record lookup

---

**Need Help?** The admin interface is intuitive, but you can always refer to Django's official admin documentation for advanced features.
