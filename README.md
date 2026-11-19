# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npm start
   ```

   Use `npm start -- --clear` when you also want to clear Metro's cache. Starting through npm rebuilds the bundled quote database first; `npx expo start` skips that step.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Quote data

`src/quoteBank.json` is the source of truth for verse text. Native builds read a generated SQLite file (`assets/data/quoteBank.db`), not the JSON directly, because parsing the 13 MB JSON into JavaScript is too slow on a device.

- After editing `src/quoteBank.json`, run `npm run build:quote-db`. `npm start` does this automatically.
- The build also writes `src/quoteBank.meta.ts` and stores the source hash inside the DB. On launch, native compares them and re-imports the bundled DB if the on-device copy is stale, so no reinstall is needed.
- `npm run check:quote-db` verifies the committed DB and meta file match the JSON — useful in CI and before EAS builds.
- Web reads `src/quoteBank.json` directly and needs no rebuild.

## Preview website

The standalone preview site is deployed to <https://bibleapreview.web.app/>.

- `npm run build:preview` exports the Expo web app and writes the deployable site to `preview-site/`.
- `npm run deploy:preview` builds it and deploys to Firebase Hosting (requires Firebase CLI access).
- `.github/workflows/firebase-hosting-preview.yml` builds and deploys to the live channel when preview-related files change on `main`.

One-time GitHub setup:

1. Create or select the Firebase project with ID `bibleapreview` and enable Hosting.
2. Generate a service account key with the **Firebase Hosting Admin** role.
3. Add the full JSON key as a GitHub Actions repository secret named `FIREBASE_SERVICE_ACCOUNT_BIBLEAPREVIEW`.
4. Push a change under `src/app/preview/` (or one of the shared paths listed in the workflow) to `main`.

`firebase init hosting:github --project bibleapreview` can also create the service account and secret automatically.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
