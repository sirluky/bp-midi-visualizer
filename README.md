
# Systém pro vizuální reprezentaci MIDI souborů s interaktivním osvětlením

## Rozběhnutí projektu
Zkontrolujte zda máte nainstalované Node.js a pro databázi Docker.
```bash
npm install

# nastartujte kontejnery
docker compose up -d

# vytvoreni struktury v databazi
npx prisma migrate dev

# Vyvojovy server
npm run dev
```

## Rozběhnutí přihlášení
```
Viz server/auth.ts, vytvořte v .env promenne pro vaseho auth providera a zadejte hodnoty viz https://next-auth.js.org/configuration/providers/oauth
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: {
        host: env.EMAIL_SERVER_HOST,
        port: env.EMAIL_SERVER_PORT,
        auth: {
          user: env.EMAIL_SERVER_USER,
          pass: env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: env.EMAIL_FROM,
```
