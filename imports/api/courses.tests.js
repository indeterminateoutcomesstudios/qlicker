/* eslint-env mocha */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// Unit tests for course data maniupulation methods

import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { expect } from 'meteor/practicalmeteor:chai'

import { _ } from 'underscore'

import { createStubs, restoreStubs } from '../../stubs.tests.js'

import { Courses } from './courses.js'
import './users.js'

if (Meteor.isServer) {
  // TODO Stub Meteor user
  const createAndStubProfessor = () => {
    const profUserId = Accounts.createUser({
      email: 'email@email.com',
      password: 'test value',
      profile: {
        firstname: 'test value',
        lastname: 'test value',
        roles: ['professor']
      }
    })
    createStubs(profUserId)
    return profUserId
  }

  describe('Courses', () => {
    const userId = Random.id()

    const sampleCourse = {
      createdAt: new Date(),
      owner: userId,
      name: 'Intro to Computer Science',
      deptCode: 'CISC',
      courseNumber: '101',
      section: '001',
      semester: 'F17'
    }
    describe('methods', () => {
      beforeEach(() => {
        Courses.remove({})
        Meteor.users.remove({})
        restoreStubs()
      })

      it('can insert new course (courses.insert)', () => {
        createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', _.extend({}, sampleCourse))

        expect(Courses.find({ _id: courseId }).count()).to.equal(1)
      })

      it('can delete course (courses.delete)', () => {
        const profUserId = createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))

        Meteor.call('courses.delete', courseId)
        expect(Courses.find({ _id: courseId }).count()).to.equal(0)
      })

      it('can regenerate code (courses.regenerateCode)', () => {
        const profUserId = createAndStubProfessor()
        const courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))
        const oldEnrollementCode = Courses.findOne({ _id: courseId }).enrollmentCode
        const course = Meteor.call('courses.regenerateCode', courseId)

        expect(course.enrollmentCode).to.not.equal(oldEnrollementCode)
      })

      it('can edit course (courses.edit)', () => {
        const profUserId = createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))

        let editedCourse = Courses.findOne({ _id: courseId })
        editedCourse.name = 'edited name'
        editedCourse.deptCode = 'edited deptCode'
        editedCourse.courseNumber = 'edited courseNumber'
        editedCourse.section = 'edited section'
        editedCourse.semester = 'edited semester'

        let newOwnerId = Random.id()
        editedCourse.owner = newOwnerId

        Meteor.call('courses.edit', editedCourse)

        // verify edits
        let courseFromDb = Courses.findOne({ _id: courseId })
        expect(courseFromDb.owner).to.equal(editedCourse.owner)
        expect(courseFromDb.name).to.equal(editedCourse.name)
        expect(courseFromDb.deptCode).to.equal(editedCourse.deptCode.toLowerCase())
        expect(courseFromDb.courseNumber).to.equal(editedCourse.courseNumber.toLowerCase())
        expect(courseFromDb.section).to.equal(editedCourse.section)
        expect(courseFromDb.semester).to.equal(editedCourse.semester.toLowerCase())
        // other method handles regenration of enrollment code
        expect(courseFromDb.enrollmentCode).to.equal(editedCourse.enrollmentCode)
      })
    })// end describe('methods')
    describe('course<=>user methods', () => {
      beforeEach(() => {
        restoreStubs()
        Courses.remove({})
        Meteor.users.remove({})
      })

      const prepStudentCourse = (assertions) => {
        const studentUserId = Accounts.createUser({
          email: 'lol@email.com',
          password: 'test value',
          profile: {
            firstname: 'test value',
            lastname: 'test value',
            roles: ['student']
          }
        })
        const profUserId = createAndStubProfessor()
        let courseId = Meteor.call('courses.insert', _.extend({ owner: profUserId }, _.omit(sampleCourse, 'owner')))

        assertions(courseId, studentUserId)
      }

      it('can add student (courses.addStudent)', () => {
        prepStudentCourse((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)

          const course = Courses.findOne({ _id: courseId })
          const student = Meteor.users.findOne({ _id: studentUserId })

          expect(course.students.length).to.equal(1)
          expect(student.profile.courses.length).to.equal(1)
        })
      })

      it('can remove student (courses.removeStudent)', () => {
        prepStudentCourse((courseId, studentUserId) => {
          Meteor.call('courses.addStudent', courseId, studentUserId)
          Meteor.call('courses.removeStudent', courseId, studentUserId)

          expect(Meteor.users.findOne({ _id: studentUserId }).profile.courses.length).to.equal(0)
          expect(Courses.findOne({ _id: courseId }).students.length).to.equal(0)
        })
      })

      it('can enroll using code (courses.checkAndEnroll)', () => {
        prepStudentCourse((courseId, studentUserId) => { // TODO
          restoreStubs()
          createStubs(studentUserId)
          const course = Courses.findOne({ _id: courseId })

          Meteor.call('courses.checkAndEnroll', course.deptCode, course.courseNumber, course.enrollmentCode)

          expect(Courses.findOne({ _id: courseId }).students.length).to.equal(1)
          expect(Meteor.users.findOne({ _id: studentUserId }).profile.courses.length).to.equal(1)
        })
      })
    }) // end describe('course<=>user methods')
    /*
    describe('course<=>session methods', () => {
      it('can create session (courses.createSession)*', () => {

      })

      it('can delete session (courses.deleteSession)*', () => {

      })
    }) // end describe('course<=>session methods')
    */
  }) // end describe('Courses')
} // end Meteor.isServer