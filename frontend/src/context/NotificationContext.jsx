import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const notify = (message, type = "success") => {
        const id = Date.now();

        setNotifications(prev => [
            ...prev,
            { id, message, type }
        ]);

        setTimeout(() => {
            setNotifications(prev =>
                prev.filter(n => n.id !== id)
            );
        }, 3000);
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            <div
                className="toast-container position-fixed top-0 end-0 p-3"
                style={{ zIndex: 3000 }}
            >
                {notifications.map(n => (
                    <div key={n.id} className={`toast show text-bg-${n.type} mb-2`}>
                        <div className="d-flex">
                            <div className="toast-body">{n.message}</div>
                            <button
                                className="btn-close btn-close-white me-2 m-auto"
                                onClick={() =>
                                    setNotifications(prev =>
                                        prev.filter(x => x.id !== n.id)
                                    )
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
