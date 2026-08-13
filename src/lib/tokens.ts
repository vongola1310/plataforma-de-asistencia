import { customAlphabet } from "nanoid";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const generate = customAlphabet(ALPHABET, 32);

/** Token de alta entropía para el link único de "mi registro" de un asistente. */
export function generateAccessToken(): string {
  return generate();
}
