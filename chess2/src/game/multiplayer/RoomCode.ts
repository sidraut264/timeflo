export class RoomCode {
  /**
   * Generates a random 5-character uppercase alphanumeric room code.
   * Excluding potentially ambiguous characters like O, 0, I, 1, L.
   */
  static generate(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
