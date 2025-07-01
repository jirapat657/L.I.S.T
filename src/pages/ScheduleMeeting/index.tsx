//src/pages/ScheduleMeeting/index.tsx
import { useEffect, useState } from 'react';

// กำหนดประเภทของ Event จาก Google Calendar API
interface Event {
  id: string;
  summary: string;
  start: {
    dateTime: string | null;
    date: string | null;
  };
}

interface GoogleUser {
  credential: string;
}

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void;
      prompt: () => void;
    };
  };
}

// Extend the Window interface to include the google property with the correct type
declare global {
  interface Window {
    google: GoogleIdentity;
  }
}

const ScheduleMeeting = () => {
  const [events, setEvents] = useState<Event[]>([]); // กำหนดประเภทของ events
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null); // เปลี่ยนเป็นประเภทที่มีการกำหนด

  useEffect(() => {
    const loadGoogleIdentityScript = () => {
      // โหลด Google Identity Services (GIS)
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogleSignIn();
      document.body.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: '714676341308-p1gikv8ce6ujsgs0p18u19a6jn2n7kme.apps.googleusercontent.com',
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button')!,
        { theme: 'outline', size: 'large' }
      );
      window.google.accounts.id.prompt(); // แสดงหน้าต่าง prompt
    };

    const handleCredentialResponse = (response: { credential: string }) => {
      console.log('Encoded JWT ID token: ' + response.credential);
      setGoogleUser(response);  // ใช้ข้อมูลที่ได้รับจากการลงชื่อเข้าใช้
      setIsAuthenticated(true);
      listUpcomingEvents();
    };

    const listUpcomingEvents = () => {
      if (googleUser && googleUser.credential) {
        const token = googleUser.credential;

        // เริ่มต้นคำขอ API Google Calendar
        fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // กำหนดพารามิเตอร์ต่าง ๆ สำหรับคำขอ API
          body: JSON.stringify({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),  // กำหนดให้เริ่มต้นจากเวลาปัจจุบัน
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
          }),
          method: 'GET',
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Google Calendar API Response:', data);
            if (data.items && data.items.length > 0) {
              setEvents(data.items);
            } else {
              setEvents([]);
            }
          })
          .catch((error) => {
            console.error('Error fetching events:', error);
          });
      }
    };


    loadGoogleIdentityScript();
  }, [googleUser]);

  return (
    <div>
      <h1>Schedule Meeting</h1>
      {isAuthenticated ? (
        <div>
          <h2>Your Upcoming Events:</h2>
          <ul>
            {events.length > 0 ? (
              events.map((event) => (
                <li key={event.id}>
                  <strong>{event.summary}</strong> <br />
                  {event.start.dateTime
                    ? new Date(event.start.dateTime).toLocaleString()
                    : event.start.date}
                </li>
              ))
            ) : (
              <p>No upcoming events found.</p>
            )}
          </ul>
        </div>
      ) : (
        <div>
          <p>Please sign in to view your Google Calendar events.</p>
          <div id="google-signin-button"></div>
        </div>
      )}
    </div>
  );
};

export default ScheduleMeeting;
