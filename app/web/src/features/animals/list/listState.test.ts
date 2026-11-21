import { describe, expect, it } from 'vitest';

import { ageRange, listQuery, listStateParams, parseListState } from './listState';

const TODAY = new Date(2026, 10, 21);
const parse = (search: string) => parseListState(new URLSearchParams(search));

describe('list state in the URL', () => {
  it('round-trips a filtered, sorted, paged heifer list', () => {
    const state = parse('tipo=vaquillas&q=12&filtro=repro&valor=GESTANTE&orden=edad:desc&pagina=3');

    expect(state).toEqual({
      kind: 'vaquillas',
      q: '12',
      filter: { category: 'repro', variable: 'GESTANTE' },
      sort: { column: 'edad', direction: 'desc' },
      page: 3,
    });
    expect(parse(listStateParams(state).toString())).toEqual(state);
  });

  it('keeps defaults out of the URL', () => {
    expect(listStateParams(parse('')).toString()).toBe('');
  });

  it('drops what a list does not offer instead of failing', () => {
    // Bulls have no Grupo filter; "ABIERTA" is a cow state, not a heifer one.
    expect(parse('tipo=toros&filtro=grupo&valor=GENERAL').filter).toBeNull();
    expect(parse('tipo=vaquillas&filtro=repro&valor=ABIERTA').filter).toBeNull();
    expect(parse('tipo=caballos').kind).toBe('vacas');
    expect(parse('orden=raza:asc').sort).toBeNull();
    // Bulls have no DIM column, cows no Edad one.
    expect(parse('tipo=toros&orden=dim:asc').sort).toBeNull();
    expect(parse('orden=edad:asc').sort).toBeNull();
    expect(parse('pagina=-2').page).toBe(1);
  });

  it('accepts a custom group id', () => {
    const id = '0b7c6a4e-55a4-4e0e-9f0e-1f6c2b0f9a11';
    expect(parse(`filtro=grupo&valor=${id}`).filter).toEqual({ category: 'grupo', variable: id });
  });
});

describe('API query', () => {
  it('maps each category onto its parameter', () => {
    const base = { kind: 'vacas', q: '', sort: null, page: 1 } as const;
    const query = (category: string, variable: string) =>
      listQuery({ ...base, filter: { category, variable } as never }, TODAY);

    expect(query('grupo', 'GENERAL').group).toBe('GENERAL');
    expect(query('raza', 'JERSEY').breed).toBe('JERSEY');
    expect(query('repro', 'ABIERTA').repro).toBe('ABIERTA');
    expect(query('salud', 'ENFERMA').health).toBe('ENFERMA');
    expect(query('bajas', 'MUERTE').removed_reason).toBe('MUERTE');
  });

  it('sends kind, trimmed search, page and the server sort key', () => {
    const query = listQuery(
      {
        kind: 'vacas',
        q: ' 001 ',
        filter: null,
        sort: { column: 'dim', direction: 'asc' },
        page: 2,
      },
      TODAY,
    );

    expect(query).toEqual({
      kind: 'VACA',
      q: '001',
      sort: '-last_calving_date',
      page: 2,
      page_size: 10,
    });
  });

  it('turns a bull age bucket into a birth-date range', () => {
    expect(ageRange('0', TODAY)).toEqual({ born_from: '2025-11-22', born_to: '2026-11-21' });
    expect(ageRange('2', TODAY)).toEqual({ born_from: '2023-11-22', born_to: '2024-11-21' });
    expect(ageRange('9+', TODAY)).toEqual({ born_to: '2017-11-21' });
  });
});
