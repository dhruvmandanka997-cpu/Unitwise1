import crypto from 'node:crypto';
import { getDatabase } from '../../db/database';
import { ProfileInput, ProfileRecord } from '../../models/profile';

export class ProfileDatabase {
  private getDb() {
    return getDatabase();
  }

  public getProfileByUserId(userId: string): ProfileRecord | null {
    const stmt = this.getDb().prepare(`
      SELECT 
        id, 
        user_id, 
        educator_name, 
        age, 
        address, 
        degree, 
        degree_other, 
        mobile_number, 
        photo_url,
        created_at, 
        updated_at
      FROM profiles
      WHERE user_id = ?
    `);

    const row: any = stmt.get(userId);
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      educatorName: row.educator_name,
      age: row.age,
      address: row.address,
      degree: row.degree,
      degreeOther: row.degree_other,
      mobileNumber: row.mobile_number,
      photoUrl: row.photo_url || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public upsertProfile(userId: string, data: ProfileInput): ProfileRecord {
    const existing = this.getProfileByUserId(userId);
    const now = new Date().toISOString();
    const photoUrlToSave = data.photoUrl !== undefined ? data.photoUrl : (existing?.photoUrl || null);

    if (existing) {
      const stmt = this.getDb().prepare(`
        UPDATE profiles
        SET 
          educator_name = ?,
          age = ?,
          address = ?,
          degree = ?,
          degree_other = ?,
          mobile_number = ?,
          photo_url = ?,
          updated_at = ?
        WHERE user_id = ?
      `);

      stmt.run(
        data.educatorName.trim(),
        data.age,
        data.address.trim(),
        data.degree,
        data.degree === 'Other' ? (data.degreeOther?.trim() || null) : null,
        data.mobileNumber.trim(),
        photoUrlToSave,
        now,
        userId
      );

      return {
        id: existing.id,
        userId,
        educatorName: data.educatorName.trim(),
        age: data.age,
        address: data.address.trim(),
        degree: data.degree,
        degreeOther: data.degree === 'Other' ? (data.degreeOther?.trim() || null) : null,
        mobileNumber: data.mobileNumber.trim(),
        photoUrl: photoUrlToSave,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
    } else {
      const newId = `prof_${crypto.randomUUID()}`;
      const stmt = this.getDb().prepare(`
        INSERT INTO profiles (
          id,
          user_id,
          educator_name,
          age,
          address,
          degree,
          degree_other,
          mobile_number,
          photo_url,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newId,
        userId,
        data.educatorName.trim(),
        data.age,
        data.address.trim(),
        data.degree,
        data.degree === 'Other' ? (data.degreeOther?.trim() || null) : null,
        data.mobileNumber.trim(),
        photoUrlToSave,
        now,
        now
      );

      return {
        id: newId,
        userId,
        educatorName: data.educatorName.trim(),
        age: data.age,
        address: data.address.trim(),
        degree: data.degree,
        degreeOther: data.degree === 'Other' ? (data.degreeOther?.trim() || null) : null,
        mobileNumber: data.mobileNumber.trim(),
        photoUrl: photoUrlToSave,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  public updatePhoto(userId: string, photoUrl: string | null): ProfileRecord {
    const existing = this.getProfileByUserId(userId);
    const now = new Date().toISOString();

    if (existing) {
      const stmt = this.getDb().prepare(`
        UPDATE profiles
        SET photo_url = ?, updated_at = ?
        WHERE user_id = ?
      `);
      stmt.run(photoUrl, now, userId);
      return {
        ...existing,
        photoUrl,
        updatedAt: now,
      };
    } else {
      const newId = `prof_${crypto.randomUUID()}`;
      const stmt = this.getDb().prepare(`
        INSERT INTO profiles (
          id,
          user_id,
          educator_name,
          age,
          address,
          degree,
          degree_other,
          mobile_number,
          photo_url,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newId,
        userId,
        'Educator',
        30,
        'Not specified',
        'B.Ed.',
        null,
        '+10000000000',
        photoUrl,
        now,
        now
      );

      return {
        id: newId,
        userId,
        educatorName: 'Educator',
        age: 30,
        address: 'Not specified',
        degree: 'B.Ed.',
        degreeOther: null,
        mobileNumber: '+10000000000',
        photoUrl,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  public deleteProfile(userId: string): boolean {
    const stmt = this.getDb().prepare('DELETE FROM profiles WHERE user_id = ?');
    const result: any = stmt.run(userId);
    return result.changes > 0;
  }
}

export const profileDb = new ProfileDatabase();
