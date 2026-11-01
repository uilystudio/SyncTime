# SyncTime

Aplikacja do znajdowania wspólnego terminu spotkania. Organizator wybiera zakres dni, uczestnicy zaznaczają dostępność, a SyncTime proponuje godziny pasujące największej liczbie osób.

## Najważniejsze funkcje

- Tworzenie spotkań online lub stacjonarnych i zapraszanie uczestników przez link.
- Kalendarz dostępności z preferowanymi godzinami i podglądem odpowiedzi grupy.
- Propozycje terminów uwzględniające długość spotkania i wymaganych uczestników.
- Zatwierdzanie terminu, deklaracje obecności i ostrzeżenia o kolizjach.
- Stałe grupy, własny kalendarz, powiadomienia i panel „Czeka na Ciebie”.
- Komentarze oraz opcjonalna agenda z decyzjami i zadaniami.
- Konta e-mail/hasło, odzyskiwanie hasła i synchronizacja zmian na żywo.
- Responsywny interfejs z obsługą myszy, dotyku i klawiatury.

## Technologie

- **Next.js 16, React 19 i TypeScript** - aplikacja i routing.
- **Tailwind CSS 4, Geist, Lucide i Motion** - wygląd, typografia, ikony i animacje.
- **Supabase: PostgreSQL, Auth i Realtime** - baza danych, logowanie i synchronizacja.
- **date-fns i date-fns-tz** - daty, strefy czasowe i zmiana czasu.

## Uruchomienie

Wymagania: **Node.js 24 LTS, npm i projekt Supabase**.

1. Zainstaluj zależności:

   ```sh
   npm ci
   ```

2. Utwórz `.env.local` na podstawie `.env.example` i uzupełnij dane swojego projektu. Jeśli plik jest już skonfigurowany, zachowaj jego zawartość.

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://TWOJ_PROJEKT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TWOJ_KLUCZ_PUBLICZNY
   ```

3. W Supabase wykonaj brakujące migracje z [`supabase/migrations`](supabase/migrations) w kolejności nazw. Włącz logowanie i rejestrację przez e-mail. W ustawieniach Auth ustaw Site URL na `http://localhost:3000`, a do Redirect URLs dodaj `http://localhost:3000/**`. Schemat `private` pozostaw poza listą Exposed schemas.

4. Uruchom aplikację:

   ```sh
   npm run dev
   ```

   Otwórz [localhost:3000](http://localhost:3000), utwórz konto i wybierz nick. Jeśli wymagane jest potwierdzenie adresu e-mail, skorzystaj z linku w otrzymanej wiadomości.

Wersję produkcyjną uruchomisz poleceniami:

```sh
npm run build
npm start
```

Na hostingu ustaw zmienne środowiskowe przed kompilacją i dodaj właściwą domenę w ustawieniach Supabase Auth.

## Struktura projektu

```text
app/                  strony i routing
components/           interfejs i formularze
hooks/                pobieranie danych, synchronizacja i stan
lib/                  algorytm terminów, daty, walidacja i API
supabase/migrations/  schemat bazy, funkcje i reguły dostępu
public/               zasoby statyczne
scripts/              narzędzia pomocnicze
```
