import { Modal } from 'flowbite-react';
import React, { useContext, useState, useEffect } from 'react';
import { Label } from 'flowbite-react';
import { Radio } from 'flowbite-react';
import { Textarea } from 'flowbite-react';
import { TextInput } from 'flowbite-react';
import { Button } from 'flowbite-react';
import { AuthContext } from '../data/context';
import { IoLogoGoogle } from 'react-icons/io';
import { IoMdLogIn } from 'react-icons/io';
import FirebaseData from '../data/db';
import { useAuthState } from 'react-firebase-hooks/auth';
/**
 * Creates a sign-in modal component
 * @param {Object} props - component props
 * @returns A sign-in modal component
 */
export const SignInModal = (props) => {
  // hooking up with the input fields
  const [email, setEmail] = useState('');
  // <rant>
  // you can see on a big form how this can get messy.
  // I respect react and all the ecosystem, but this is why I don't enjoy coding it too much.
  // It forces you into this functional pattern development,
  // but it doesn't give you enough support out-of-the-box to make it worth it, imo.
  // so you need to keep installing new dependencies to cover edge cases react doesnt support.
  // or maybe i'm just entitled lmao.
  //</rant>
  const [password, setPassword] = useState('');
  // hook up to the auth context
  const { user } = useContext(AuthContext);
  // call the firebase auth with google
  const doSignInWithGoogle = async (e) => {
    e.preventDefault();
    await FirebaseData.signInWithGoogle();
  };
  const doSignInWithEmail = async (e) => {
    e.preventDefault();
    await FirebaseData.logInWithEmailAndPassword(email, password);
  };
  // when the user logs in, close the modal
  useEffect(() => {
    if (user) {
      //console.log("SignInModal: User Logged In", user);
      props.onClose();
    }
  }, [user]);
  return (
    <Modal
      show={props.show}
      size='md'
      popup={true}
      onClose={props.onClose}
      position={'center'}
      root={document.getElementById('root')}
    >
      <Modal.Header />
      <Modal.Body>
        <div className='space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8'>
          <h3 className='text-xl font-medium text-white'>
            Sign in to Exoplanets Review
          </h3>
          <div className='fluid-button-bar'>
            <Button
              href='/sign-in/google'
              outline={true}
              onClick={doSignInWithGoogle}
              gradientMonochrome='failure'
              size='xl'
            >
              <IoLogoGoogle
                className='text-xl group-hover:animate-pulse transition-all'
                size={28}
              />
              <span className='sm:text-md md:text-md lg:text-lg'>
                Sign In With Google
              </span>
            </Button>
          </div>
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='email' value='Your email' />
            </div>
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id='email'
              placeholder='name@company.com'
              required={true}
            />
          </div>
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='password' value='Your password' />
            </div>
            <TextInput
              id='password'
              type='password'
              required={true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='flex justify-between'>
            <a
              href='/sign-in/reset-password'
              className='text-sm text-blue-700 hover:underline dark:text-blue-500'
            >
              Lost Password?
            </a>
          </div>
          <div className='fluid-button-bar'>
            <Button
              onClick={doSignInWithEmail}
              href='/sign-in/email'
              outline={true}
              gradientDuoTone='cyanToBlue'
              size='xl'
            >
              <IoMdLogIn
                className='text-xl group-hover:animate-bounce_x transition-all'
                size={28}
              />
              <span className='sm:text-md md:text-md lg:text-lg'>Sign In</span>
            </Button>
          </div>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-300'>
            Not registered?{' '}
            <a
              href='/modal'
              className='text-blue-700 hover:underline dark:text-blue-500'
            >
              Create account
            </a>
            <hr className='mt-4' />
            <aside className='italic mt-2'>
              <strong className='text-cyan-500'>Privacy Policy:</strong> This
              form is only to demonstrate a sign-in functionality with React +
              Firebase for educational purposes. I won't be keeping any of your
              data and this database will probably get deleted at some point.
              <br />
              If you still don't feel like creating an account, you can sign in
              with:{' '}
              <strong className='text-cyan-500'>
                explorer@exoplanets.io
              </strong>{' '}
              and password <strong className='text-white'>milkyway</strong>.
            </aside>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
//
//
//
//
export const SignUpModal = (props) => {
  // hooking up with the input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  /**
   * Calls the FirebaseData utility to sign up with Google.
   * Since this function is called from an <a> with a href, it will preventDefault.
   * @param {MouseEvent} e the mouse eventto prevent default
   */
  const doSignInWithGoogle = async (e) => {
    e.preventDefault();
    await FirebaseData.signInWithGoogle();
  };
  /**
   * Calls the FirebaseData utility to sign up with email and password.
   * Since this function is called from an <a> with a href, it will preventDefault.
   * @param {MouseEvent} e the mouse event to prevent default
   * @returns {Promise<void>}
   */
  const doSignInWithEmail = async (e) => {
    e.preventDefault();
    if (!name) {
      alert('Please enter name');
      return;
    }
    await FirebaseData.registerWithEmailAndPassword(name, email, password);
  };
  // using the lib firebase-react to hook to the auth state
  const [user, loading, error] = useAuthState(FirebaseData.auth);
  //
  useEffect(() => {
    if (loading) return;
    if (user) {
      props.onClose(); // when the user logs in, close the modal
      //reset the form fields
      setEmail('');
      setPassword('');
      setName('');
    }
    if (error) alert(error);
  }, [user, loading]);
  //
  return (
    <Modal
      show={props.show}
      size='md'
      popup={true}
      onClose={props.onClose}
      position={'center'}
      root={document.getElementById('root')}
    >
      <Modal.Header>Sign up to Exoplanets Review</Modal.Header>
      <Modal.Body>
        <div className='space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8'>
          <div className='fluid-button-bar'>
            <Button
              href='/sign-un/google'
              outline={true}
              onClick={doSignInWithGoogle}
              gradientMonochrome='failure'
              size='xl'
            >
              <IoLogoGoogle
                className='text-xl group-hover:animate-pulse transition-all'
                size={28}
              />
              <span className='sm:text-md md:text-md lg:text-lg'>
                Sign Up With Google
              </span>
            </Button>
          </div>
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='name' value='Your Name' />
            </div>
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              id='name'
              placeholder='Exoplanet Jokey'
              required={true}
            />
          </div>
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='email' value='Your email' />
            </div>
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id='email'
              placeholder='name@company.com'
              required={true}
            />
          </div>
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='password' value='Your password' />
            </div>
            <TextInput
              id='password'
              type='password'
              required={true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='fluid-button-bar'>
            <Button
              onClick={(e) => doSignInWithEmail(e)}
              href='/sign-up/email'
              outline={true}
              gradientDuoTone='cyanToBlue'
              size='xl'
            >
              <IoMdLogIn
                className='text-xl group-hover:animate-bounce_x transition-all'
                size={28}
              />
              <span className='sm:text-md md:text-md lg:text-lg'>Sign Up</span>
            </Button>
          </div>
          <div className='text-sm font-medium text-gray-500 dark:text-gray-300'>
            Already registered?{' '}
            <a
              href='/modal'
              className='text-blue-700 hover:underline dark:text-blue-500'
            >
              Sign In
            </a>
            <hr className='mt-4' />
            <aside className='italic mt-2'>
              <strong className='text-cyan-500'>Privacy Policy:</strong> This
              form is only to demonstrate a sign-in functionality with React +
              Firebase for educational purposes. I won't be keeping any of your
              data and this database will probably get deleted at some point.
              <br />
              If you still don't feel like creating an account, you can sign in
              with:{' '}
              <strong className='text-cyan-500'>
                explorer@exoplanets.io
              </strong>{' '}
              and password <strong className='text-white'>milkyway</strong>.
            </aside>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
//
//
//
//
export const ReviewModal = (props) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(4);
  const userId = props.user != null ? props.user.uid : null;
  const planetId = props.planet_id;
  //
  const doPostReview = async (e) => {
    e.preventDefault();
    FirebaseData.createReview(userId, planetId, title, body, rating)
      .then(() => {
        FirebaseData.messageHandler('Review Posted');
        props.onClose();
      })
      .catch((err) => {
        console.error(err);
        FirebaseData.errorHandler(err.message);
      });
  };
  //
  return (
    <Modal
      show={props.show}
      size='md'
      popup={true}
      onClose={props.onClose}
      position={'center'}
      root={document.getElementById('root')}
    >
      <Modal.Header>Write a review</Modal.Header>
      <Modal.Body>
        <div className='flex items-center justify-center'>
          <fieldset
            className='-mx-2 p-0'
            onChange={(event) => setRating(event.target.value)}
          >
            <legend className='italic text-slate-200'>
              How would you rate this planet?
            </legend>
            <span className='star-cb-group'>
              <input type='radio' id='rating-5' name='rating' value='5' />
              <label htmlFor='rating-5'>5</label>
              <input
                type='radio'
                id='rating-4'
                name='rating'
                value='4'
                defaultChecked={true}
              />
              <label htmlFor='rating-4'>4</label>
              <input type='radio' id='rating-3' name='rating' value='3' />
              <label htmlFor='rating-3'>3</label>
              <input type='radio' id='rating-2' name='rating' value='2' />
              <label htmlFor='rating-2'>2</label>
              <input type='radio' id='rating-1' name='rating' value='1' />
              <label htmlFor='rating-1'>1</label>
              <input
                type='radio'
                id='rating-0'
                name='rating'
                value='0'
                className='star-cb-clear'
              />
              <label htmlFor='rating-0'>0</label>
            </span>
          </fieldset>
        </div>
        <div className='my-2'>
          <div className='mb-2 block'>
            <Label htmlFor='name' value='Review Title' />
          </div>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            id='title'
            placeholder='Give it a title!'
            required={true}
          />
        </div>
        <div className='my-2'>
          <div className='mb-2 block'>
            <Label htmlFor='name' value='Review Text' />
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder='What are your thoughts on this exoplanet?'
            required={true}
            rows={4}
          />
        </div>
        <div className='fluid-button-bar mt-4'>
          <Button
            onClick={(e) => doPostReview(e)}
            href='/review/post'
            outline={true}
            gradientDuoTone='tealToLime'
            size='xl'
          >
            <IoMdLogIn
              className='text-xl group-hover:animate-bounce_x transition-all'
              size={28}
            />
            <span className='sm:text-md md:text-md lg:text-lg'>
              Post Review
            </span>
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};
