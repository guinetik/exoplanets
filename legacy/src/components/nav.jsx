import { Navbar } from 'flowbite-react';
import { Dropdown } from 'flowbite-react';
import { Avatar, Modal } from 'flowbite-react';
import { NavLink, useNavigate } from 'react-router-dom';
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../data/context';
import { SignInModal, SignUpModal } from './modals';
import AppData from '../data/app.data';
import FirebaseData from '../data/db';
import logo from '../logo.svg';
/**
 * Creates a nav component with a mobile dropdown menu and sign-in options.
 * @returns A functional component to render the main site's navigation
 */
export default function KeplerNav() {
  const doSignOut = (e) => {
    e.preventDefault();
    setSignedIn(false);
    FirebaseData.logout();
  };
  //
  const [isSignInModalOpen, setSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setSignUpModalOpen] = useState(false);
  // getting the user from the context
  const { user } = useContext(AuthContext);
  //const user = {};
  const [signedin, setSignedIn] = useState(false);
  //
  useEffect(() => {
    //console.log("logged user", user);
    setSignedIn(user != null);
  }, [user]);
  //
  return (
    <div className='fixed left-0 right-0 z-50'>
      <SignInModal
        show={isSignInModalOpen}
        onClose={() => {
          setSignInModalOpen(false);
        }}
      />
      <SignUpModal
        show={isSignUpModalOpen}
        onClose={() => {
          setSignUpModalOpen(false);
        }}
      />
      <Navbar fluid={true} rounded={true}>
        <Navbar.Brand href='/'>
          <img
            src='https://exoplanets.nasa.gov/assets/galaxy_icon.svg'
            className='mr-3 h-6 sm:h-9'
            alt='Logo'
          />
          <span className='self-center whitespace-nowrap text-xl font-semibold dark:text-white'>
            Exoplanets Review
          </span>
        </Navbar.Brand>
        <div className='flex md:order-2 z-50'>
          <MobileNavDropDown
            doSignOut={doSignOut}
            toggleSignIn={setSignInModalOpen}
            toggleSignUp={setSignUpModalOpen}
            items={AppData.nav.dropdown}
            signed_in={signedin}
            user={user}
          />
          <Navbar.Toggle />
        </div>
        <MainNav items={AppData.nav.main} />
      </Navbar>
    </div>
  );
}
/**
 * Lets reduce frontend boiler plate by creating a functional component for the nav
 * @param {items} props
 * @returns A functional component to render the main nav. uses flowbite's <Navbar.Collapse>
 */
const MainNav = (props) => {
  //console.log("MainNav", props.items);
  const navItems = props.items.map((item) => {
    return <MainNavItem key={item.key} title={item.title} link={item.key} />;
  });
  //console.log(navItems);
  return <Navbar.Collapse>{navItems}</Navbar.Collapse>;
};
/**
 * Each main nav item render as a <NavLink>
 * @param {link, title} props
 * @returns A functional component to render a nav Item
 */
const MainNavItem = (props) => {
  //console.log("MainNavItem", props);
  return (
    <NavLink
      to={props.link}
      className='block py-2 pr-4 pl-3 md:p-0 border-b border-gray-100  text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-white'
    >
      {props.title}
    </NavLink>
  );
};
/**
 * Creates a dropdown menu base on the user's sign-in status.
 * If the user is signed in, return a header with their avatar.
 * If the user is not signed in, return a dropdown with links to sign-in and sign-up.
 * @param {Object} props - component props
 * @returns A functional component to render the dropdown header
 */
const NavDropdownHeader = (props) => {
  /**
   * A reference to the user's profile
   */
  let userContent = null;
  /**
   * Creates a state to store the user's display name
   */
  const [displayName, setDisplayName] = useState('');
  /**
   * this hook will get the user's display name from their profile at first,
   * if it doesnt find it, will call the DB to get the user details
   */
  useEffect(() => {
    async function fetchData() {
      userContent = await FirebaseData.getLoggedUserByEmail(props.user.email);
      //console.log("NavDropdownHeader.userContent:", userContent);
      setDisplayName(userContent ? userContent.name : props.user.email);
    }
    if (props.user) {
      if (props.user.displayName) {
        setDisplayName(props.user.displayName);
      } else {
        fetchData();
      }
    }
  }, [props.user]);
  if (props.isSignedIn) {
    return (
      <Dropdown.Header className='z-50'>
        <span className='block text-sm'>{displayName}</span>
      </Dropdown.Header>
    );
  } else {
    return (
      <Dropdown.Header className='z-50'>
        <Dropdown.Item onClick={() => props.toggleSignIn(true)}>
          Sign In
        </Dropdown.Item>
        <Dropdown.Item onClick={() => props.toggleSignUp(true)}>
          Sign Up
        </Dropdown.Item>
      </Dropdown.Header>
    );
  }
};
/**
 * Creates a dropdown menu based on props.items array.
 * Iterates the menu items array and creates a <Dropdown.Item> for each item.
 * @param {Object} props - component props
 * @returns A functional component to render the dropdown menu on mobile
 */
const MobileNavDropDown = (props) => {
  const navigate = useNavigate();
  let userContent = null;
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  //
  useEffect(() => {
    async function fetchData() {
      userContent = await FirebaseData.getLoggedUserByEmail(props.user.email);
      //console.log("NavDropdownHeader.userContent:", userContent);
      setDisplayName(userContent ? userContent.name : props.user.email);
      const avatar = userContent
        ? userContent.avatar
        : `https://ui-avatars.com/api/?name=${displayName}`;
      console.log('avatar:', avatar);
      setAvatar(avatar);
    }
    if (props.user) {
      fetchData();
    }
  }, [props.user]);
  /**
   * This function is called when the user clicks the drop down items.
   * It will check for the item.key and call a function declared on the props.
   * Menu items are defined in the AppData.nav.dropdown array.
   * @param {MouseEvent} e
   * @param {Object} item
   */
  const onDropdownClick = (e, item) => {
    e.preventDefault();
    console.log('onDropdownClick:', item);
    if (item.key === 'signout') {
      props.doSignOut(e);
    } else if (item.key == 'random-planet') {
      const randomPlanet =
        AppData.exoplanets[
          Math.floor(Math.random() * AppData.exoplanets.length)
        ];
      const planetId = randomPlanet.id;
      navigate(`/planets/${planetId}`, { replace: false });
    }
  };
  const isSignedIn = props.signed_in;
  //console.log("NavDropDown", isSignedIn, props.items);
  const dropdownItems = props.items.map((item) => {
    if (
      item.show === 'always' ||
      (item.show === 'signedin' && isSignedIn) ||
      (item.show === 'signedout' && !isSignedIn)
    ) {
      //console.log("showing", item.title);
      if (item.divider) {
        return (
          <div key={item.key}>
            <Dropdown.Divider />
            <Dropdown.Item
              onClick={(e) => {
                onDropdownClick(e, item);
              }}
            >
              {item.title}
            </Dropdown.Item>
          </div>
        );
      } else {
        return (
          <Dropdown.Item
            key={item.key}
            onClick={(e) => {
              onDropdownClick(e, item);
            }}
          >
            {item.title}
          </Dropdown.Item>
        );
      }
    } else return null;
  });
  //
  let avatarLabel;
  const user = props.user;
  if (isSignedIn && user) {
    avatarLabel = <Avatar alt='User' img={avatar} rounded={true} />;
  } else {
    avatarLabel = <Avatar alt='User' img={logo} rounded={true} />;
  }

  return (
    <Dropdown
      arrowIcon={false}
      inline={true}
      label={avatarLabel}
      dismissOnClick={true}
    >
      <NavDropdownHeader
        isSignedIn={isSignedIn}
        user={props.user}
        toggleSignIn={props.toggleSignIn}
        toggleSignUp={props.toggleSignUp}
      />
      {dropdownItems}
    </Dropdown>
  );
};
