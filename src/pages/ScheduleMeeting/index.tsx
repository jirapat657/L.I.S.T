import { useEffect, useState } from 'react';

// กำหนดประเภทของ gapi จาก Google API Client
declare global {
  interface Window {
    gapi: {
      load: (name: string, callback: () => void) => void;
      client: {
        init: (config: { apiKey: string; clientId: string; scope: string; discoveryDocs: string[] }) => Promise<void>;
        calendar: {
          events: {
            list: (params: {
              calendarId: string;
              timeMin: string;
              maxResults: number;
              singleEvents: boolean;
              orderBy: string;
            }) => Promise<{ result: { items: Event[] } }>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
          };
          signIn: () => Promise<unknown>;
        };
      };
    };
  }
}

// กำหนดประเภทของ Event จาก Google Calendar API
interface Event {
  id: string;
  summary: string;
  start: {
    dateTime: string | null;
    date: string | null;
  };
}

const ScheduleMeeting = () => {
  const [events, setEvents] = useState<Event[]>([]);  // กำหนดประเภทของ events
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const loadGoogleApi = () => {
      if (window.gapi) {  // ตรวจสอบว่า gapi ถูกโหลดมาแล้ว
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            apiKey: 'AIzaSyAA0HOLwaeNwBcle773IsOcYbgmq-Ty2NA',
            clientId: '714676341308-p1gikv8ce6ujsgs0p18u19a6jn2n7kme.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          }).then(() => {
            const authInstance = window.gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
              setIsAuthenticated(true);
              listUpcomingEvents();
            } else {
              authInstance.signIn().then(() => {
                setIsAuthenticated(true);
                listUpcomingEvents();
              });
            }
          });
        });
      } else {
        console.error("gapi is not loaded yet.");
      }
    };

    const listUpcomingEvents = () => {
      if (window.gapi && window.gapi.client) {  // ตรวจสอบว่า gapi.client พร้อมใช้งาน
        window.gapi.client.calendar.events.list({
          calendarId: 'primary',
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        }).then((response: { result: { items: Event[] } }) => {
          const eventsList = response.result.items;
          setEvents(eventsList);
        }).catch((error) => {
          console.error("Error fetching events:", error);
        });
      }
    };

    loadGoogleApi();
  }, []);

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
        <p>Please sign in to view your Google Calendar events.</p>
      )}
    </div>
  );
};

export default ScheduleMeeting;
