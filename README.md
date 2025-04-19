# Emotion Dice

A web application designed to randomly select emotions for improv class exercises and activities. This tool helps actors and improv students explore and express a wide range of emotions during practice and performances.

## Features

- Randomly selects from a diverse collection of emotions
- Displays visual representations of emotions when available
- Simple, intuitive interface with a single "roll" button
- Provides context and prompts to help users engage with the selected emotion

## Purpose

Emotion Dice was created specifically for improv classes to:
- Help actors practice expressing different emotional states
- Introduce variety and spontaneity into improv exercises
- Challenge performers to embody emotions they might not typically explore
- Serve as a teaching tool for emotional range and expression

## Deployment Steps

1. **Build your app**:
```bash
   npm run build 
```

2. **Upload Your Files**:
```bash
   aws s3 sync dist/ s3://<bucket-name> --delete
```
