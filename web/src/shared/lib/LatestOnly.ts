/** A counter 'only the result of the latest call is used': each call takes a ticket number, a result that carries an old ticket is dropped (avoiding a race). */
export class LatestOnly {
  private latest = 0;

  /** Starts a new call and returns its ticket; every earlier ticket becomes invalid. */
  begin(): number {
    this.latest += 1;
    return this.latest;
  }

  /** Whether this ticket still belongs to the latest call. */
  isCurrent(ticket: number): boolean {
    return ticket === this.latest;
  }
}
