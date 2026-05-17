import SettingView from "./_components/setting-view";
import UserManagementView from "./_components/user-management-view";

const AdminPage = () => {
    return (
        <div className="max-w-7xl mx-auto p-4 space-y-12">
            <SettingView />
            <div className="border-t pt-8">
                <UserManagementView />
            </div>
        </div>
    );
};

export default AdminPage;