<template>
  <nav class="navbar navbar-dark my-bg-dark">
    <div class="container-fluid" style="width:1200px">
      <div style="display:flex;width: 50%;align-items: center;">
        <img style="width: 150px;height: 32px;margin-right: 12px;" @click="docs" src="@/assets/img/logo.jpg"
             alt="HumPOG-logo"/>
        <a class="navbar-brand brand-small">
          <p style="margin:0;line-height:1.2rem;font-size: 1.1rem;font-weight: 500;">Human Population<br> Omics Group
          </p>
        </a>
      </div>
      <!--      先把搜索栏注释掉-->
      <!--      <form class="d-flex">-->
      <!--        <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">-->
      <!--        <button type="button" class="btn btn-outline-primary">Search</button>-->
      <!--      </form>-->
      <div class="auth-links">
        <template v-if="currentUser">
          <button v-if="isAdminUser" type="button" @click="$router.push('/admin')">Admin</button>
          <button type="button" @click="$router.push('/account')">Account</button>
          <span>{{ currentUser.username }} · {{ currentUser.accessLevel }}</span>
          <button type="button" @click="logout">Logout</button>
        </template>
        <button v-else type="button" @click="$router.push('/login')">Login</button>
      </div>
    </div>
  </nav>
</template>

<script>
import { clearAuth, getCurrentUser, isAdmin } from '@/utils/auth'

export default {
  name: 'GroupNav',
  data() {
    return {
      currentUser: getCurrentUser()
    }
  },
  computed: {
    isAdminUser() {
      return isAdmin(this.currentUser)
    }
  },
  mounted() {
    window.addEventListener('cpc-auth-changed', this.refreshUser)
  },
  beforeDestroy() {
    window.removeEventListener('cpc-auth-changed', this.refreshUser)
  },
  methods: {
    docs() {
      // console.log("转到课题组网站");
      window.location.href = 'https://pog.fudan.edu.cn';
    },
    refreshUser() {
      this.currentUser = getCurrentUser()
    },
    logout() {
      clearAuth()
      if (this.$route.path === '/admin') {
        this.$router.push('/home')
      }
    }
  },

}
</script>

<style>
.brand-small {
  font-size: 1rem;
  font-weight: 550;
}

.my-bg-dark {
  background-color: rgb(8, 22, 49) !important;
}

.auth-links {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 0.92rem;
}

.auth-links button {
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 5px;
  padding: 5px 11px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
}
</style>
