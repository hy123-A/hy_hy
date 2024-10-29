// 存储相关功能
class Storage {
    static getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    static setUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    }

    static addUser(user) {
        const users = this.getUsers();
        users.push(user);
        this.setUsers(users);
    }

    static getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('currentUser'));
    }

    static setCurrentUser(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    static clearSession() {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isAdmin');
    }

    static getGuestUsageCount() {
        return parseInt(localStorage.getItem('guestUsageCount')) || 3;
    }

    static setGuestUsageCount(count) {
        localStorage.setItem('guestUsageCount', count);
    }

    static updateUser(updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.username === updatedUser.username);
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    static deleteUser(username) {
        let users = this.getUsers();
        users = users.filter(u => u.username !== username);
        localStorage.setItem('users', JSON.stringify(users));
    }

    static getUpgradeApplications() {
        return JSON.parse(localStorage.getItem('upgradeApplications')) || [];
    }

    static setUpgradeApplications(applications) {
        localStorage.setItem('upgradeApplications', JSON.stringify(applications));
    }

    static addUpgradeApplication(application) {
        const applications = this.getUpgradeApplications();
        applications.push(application);
        this.setUpgradeApplications(applications);
    }

    static updateUpgradeApplication(applicationId, status) {
        const applications = this.getUpgradeApplications();
        const index = applications.findIndex(a => a.id === applicationId);
        if (index !== -1) {
            applications[index].status = status;
            this.setUpgradeApplications(applications);
        }
    }

    static getPasswordResetApplications() {
        return JSON.parse(localStorage.getItem('passwordResetApplications')) || [];
    }

    static setPasswordResetApplications(applications) {
        localStorage.setItem('passwordResetApplications', JSON.stringify(applications));
    }

    static addPasswordResetApplication(application) {
        const applications = this.getPasswordResetApplications();
        applications.push(application);
        this.setPasswordResetApplications(applications);
    }

    static updatePasswordResetApplication(applicationId, status) {
        const applications = this.getPasswordResetApplications();
        const index = applications.findIndex(a => a.id === applicationId);
        if (index !== -1) {
            applications[index].status = status;
            this.setPasswordResetApplications(applications);
        }
    }
} 