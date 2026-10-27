import { describe, it, expect } from 'vitest';
import {
  ImageRejectedError,
  ImageReviewRequiredError,
  DomainError,
} from '../../../src/domain/errors/DomainError.js';

describe('Domain — ImageRejectedError', () => {
  it('Hereda de DomainError', () => {
    const err = new ImageRejectedError();
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(Error);
  });

  it('Tiene code IMAGE_REJECTED', () => {
    const err = new ImageRejectedError();
    expect(err.code).toBe('IMAGE_REJECTED');
  });

  it('Acepta mensaje y reason personalizados', () => {
    const msg = 'La imagen es un meme.';
    const reason = 'a meme with text and characters (score: 0.92)';
    const err = new ImageRejectedError(msg, reason);
    expect(err.message).toBe(msg);
    expect(err.reason).toBe(reason);
  });

  it('Usa mensaje por defecto cuando no se proporciona', () => {
    const err = new ImageRejectedError();
    expect(err.message).toBeTruthy();
    expect(err.reason).toBe('');
  });

  it('name es ImageRejectedError', () => {
    const err = new ImageRejectedError();
    expect(err.name).toBe('ImageRejectedError');
  });
});

describe('Domain — ImageReviewRequiredError', () => {
  it('Hereda de DomainError', () => {
    const err = new ImageReviewRequiredError();
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(Error);
  });

  it('Tiene code IMAGE_REVIEW_REQUIRED', () => {
    const err = new ImageReviewRequiredError();
    expect(err.code).toBe('IMAGE_REVIEW_REQUIRED');
  });

  it('Acepta mensaje y reason personalizados', () => {
    const msg = 'Resultado ambiguo.';
    const reason = 'a real photograph of a plant leaf (score: 0.51)';
    const err = new ImageReviewRequiredError(msg, reason);
    expect(err.message).toBe(msg);
    expect(err.reason).toBe(reason);
  });

  it('Usa mensaje por defecto cuando no se proporciona', () => {
    const err = new ImageReviewRequiredError();
    expect(err.message).toBeTruthy();
    expect(err.reason).toBe('');
  });

  it('name es ImageReviewRequiredError', () => {
    const err = new ImageReviewRequiredError();
    expect(err.name).toBe('ImageReviewRequiredError');
  });
});
